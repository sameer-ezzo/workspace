import { Component, computed, inject, Injector, input, LOCALE_ID, runInInjectionContext } from "@angular/core";
import { Class, ObjectId } from "@noah-ark/common";
import { ActionDescriptor, DynamicComponent, provideComponent, camelCaseToTitle } from "@upupa/common";
import { DataAdapter } from "@upupa/data";
import { MatBtnComponent } from "@upupa/mat-btn";
import { DialogConfig, DialogService } from "@upupa/dialog";
import { firstValueFrom } from "rxjs";

import { NgControl } from "@angular/forms";
import { DataFormComponent, reflectFormViewModelType } from "@upupa/dynamic-form";
import { cloneDeep } from "@noah-ark/common";
import { languageDir } from "@upupa/language";

@Component({
    selector: "translation-btn",
    template: ``,
})
export class TranslationButtonComponent<TItem = unknown> {
    injector = inject(Injector);
    adapter = inject(DataAdapter, { optional: true });

    disabled = computed(() => {
        return !this.item()["lang"] || this.locale().code === this.item()["lang"];
    });

    item = input<TItem>(); //from cell template
    valueFn = input<(btn: TranslationButtonComponent<TItem>) => TItem>(() => this.item());
    translationFn = input<(btn: TranslationButtonComponent<TItem>, lang: string) => TItem>(undefined);

    dialogOptions = input<any>({ title: "Create" });
    btn = input<ActionDescriptor>({ name: "translate", color: "primary", icon: "translate", variant: "raised" });
    locale_id = inject(LOCALE_ID);
    baseLocale = input.required<{ nativeName: string; code: string }>();
    locale = input.required<{ nativeName: string; code: string }>();

    formViewModel = input<Class<TItem>>();
    updateAdapter = input<boolean>(false);
}

@Component({
    selector: "embed-translation-btn",
    template: ` <mat-btn (action)="translate()" [disabled]="disabled()" [buttonDescriptor]="btn()"></mat-btn> `,
    styles: `
        :host {
            margin-inline: 0.25rem;
        }
    `,
    imports: [MatBtnComponent],
})
export class EmbedTranslationButton<TItem = unknown> extends TranslationButtonComponent<TItem> {
    override translationFn = input<(btn: TranslationButtonComponent<TItem>, lang: string) => TItem>(() => this.item()["translations"]?.find((t) => t.lang === this.locale().code));

    async translate() {
        const dialogOptions = this.dialogOptions() ?? {};
        runInInjectionContext(this.injector, async () => {
            const _injector = inject(Injector);
            const injector = Injector.create({ providers: [{ provide: NgControl, useValue: undefined }], parent: _injector }); // disconnect parent form control (dialog form will start a new control context)
            const dialog = inject(DialogService);
            const mirror = { ...reflectFormViewModelType(this.formViewModel()), actions: [] };

            const value = this.valueFn()?.(this) ?? this.item() ?? new mirror.viewModelType();
            const v = await value;
            const { code, nativeName } = this.locale();
            const trans = v.translations ?? [];
            const _translations = Array.isArray(trans) ? cloneDeep(trans) : Object.entries(trans).map(([lang, value]: [string, any]) => ({ ...value, lang }));
            const _value = Object.assign(
                {},
                v,
                _translations.find((t) => t.lang === code),
                { lang: code },
            );
            delete _value._id;
            delete _value.translations; // to prevent json circular reference

            mirror.viewModelType = Object; // to prevent view model submit handler
            mirror.actions = [];
            mirror.viewModelType = undefined;
            const dialogRef = dialog.open(
                {
                    component: DataFormComponent,
                    inputs: {
                        viewModel: mirror,
                        value: _value,
                    },
                    injector,
                },
                {
                    width: "90%",
                    maxWidth: "750px",
                    maxHeight: "95vh",
                    disableClose: true,
                    ...dialogOptions,
                    direction: languageDir(this.locale().code),
                    title: nativeName,
                    footer: [
                        provideComponent({
                            component: MatBtnComponent,
                            injector: injector,
                            inputs: {
                                buttonDescriptor: {
                                    name: "submit",
                                    text: "Submit",
                                    icon: "save",
                                    type: "submit",
                                    variant: "raised",
                                },
                            },
                            outputs: {
                                action: async () => {
                                    const dataFormComponent = await firstValueFrom(dialogRef.afterAttached()).then((ref) => ref.instance);
                                    const res = await dataFormComponent.submit();
                                    dialogRef.close(res);
                                },
                            },
                        }),
                    ],
                },
            );
            const result = await firstValueFrom(dialogRef.afterClosed());
            if (result) {
                const { submitResult } = result;
                await this.adapter.put(v, {
                    ...v,
                    translations: [..._translations.filter((t) => t.lang !== code), { ...submitResult, lang: code }],
                });
            }
        });
    }
}

@Component({
    selector: "link-translation-btn",
    template: ` <mat-btn (action)="translate()" [disabled]="disabled()" [buttonDescriptor]="btn()"></mat-btn> `,
    styles: `
        :host {
            margin-inline: 0.25rem;
        }
    `,
    imports: [MatBtnComponent],
})
export class LinkTranslationButton<TItem = unknown> extends TranslationButtonComponent<TItem> {
    override translationFn = input.required<(btn: TranslationButtonComponent<TItem>, lang: string) => TItem>();

    async translate() {
        const dialogOptions = this.dialogOptions() ?? {};
        runInInjectionContext(this.injector, async () => {
            const _injector = inject(Injector);
            const injector = Injector.create({ providers: [{ provide: NgControl, useValue: undefined }], parent: _injector }); // disconnect parent form control (dialog form will start a new control context)
            const dialog = inject(DialogService);
            const mirror = { ...reflectFormViewModelType(this.formViewModel()), actions: [] };

            const originalDocPromise = this.valueFn()?.(this) ?? this.item() ?? new mirror.viewModelType();
            const translationPromise = this.translationFn()?.(this, this.locale().code) ?? null;

            const originalDoc = await originalDocPromise;
            const translation = await translationPromise;

            const { code, nativeName } = this.locale();
            const _value = Object.assign({}, originalDoc, { _id: ObjectId.generate(), ...translation, lang: code });
            const translation_id = _value["translation_id"] ?? ObjectId.generate();

            mirror.viewModelType = Object; // to prevent view model submit handler
            mirror.actions = [];
            mirror.viewModelType = undefined;
            const dialogRef = dialog.open(
                { component: DataFormComponent, inputs: { viewModel: mirror, value: _value }, injector },
                {
                    width: "90%",
                    maxWidth: "750px",
                    maxHeight: "95vh",
                    disableClose: true,
                    ...dialogOptions,
                    direction: languageDir(this.locale().code),
                    title: nativeName,
                    footer: [
                        provideComponent({
                            component: MatBtnComponent,
                            injector: injector,
                            inputs: {
                                buttonDescriptor: {
                                    name: "submit",
                                    text: "Submit",
                                    icon: "save",
                                    type: "submit",
                                    variant: "raised",
                                },
                            },
                            outputs: {
                                action: async () => {
                                    const dataFormComponent = await firstValueFrom(dialogRef.afterAttached()).then((ref) => ref.instance);
                                    const res = await dataFormComponent.submit();
                                    dialogRef.close(res);
                                },
                            },
                        }),
                    ],
                },
            );
            const result = await firstValueFrom(dialogRef.afterClosed());
            if (result) {
                const { submitResult } = result;
                delete submitResult["_id"];
                let newT = null;
                if (translation) {
                    newT = await this.adapter.put(translation, {
                        ...submitResult,
                        lang: code,
                        translation_id,
                        translations: [{ lang: this.item()["lang"], translation: this.item()["_id"] }],
                    });
                } else {
                    newT = await this.adapter.create({
                        ...submitResult,
                        lang: code,
                        translation_id,
                        translations: [{ lang: this.item()["lang"], translation: this.item()["_id"] }],
                    });
                }

                const ts = this.item()["translations"] ?? [];
                await this.adapter.patch(this.item(), [
                    { op: "replace", path: "translation_id", value: translation_id },
                    { op: "replace", path: "translations", value: [...ts, { lang: code, translation: newT._id }] },
                ]);
            }
        });
    }
}
export type TranslationButtonComp<TItem = unknown> = EmbedTranslationButton<TItem> | LinkTranslationButton<TItem>;
export function translateButton<TItem = unknown>(
    formViewModel: Class,
    value: TItem | ((btn: TranslationButtonComp<TItem>) => TItem) = () => new formViewModel(),
    translation: TItem | ((btn: TranslationButtonComp<TItem>, lang: string) => TItem),
    options: {
        dialogOptions?: Partial<DialogConfig>;
        updateAdapter?: boolean;
        strategy: "link" | "embed";
        baseLocale: { nativeName: string; code: string };
        locale: { nativeName: string; code: string };
    },
): DynamicComponent<TranslationButtonComp<TItem>> {
    const defaultCreateDescriptor: Partial<ActionDescriptor> = {
        text: camelCaseToTitle(options.locale.nativeName),
        variant: "stroked",
        type: "button",
    };
    const btn = { ...defaultCreateDescriptor } as ActionDescriptor;
    const dialogOptions = { title: options.locale.nativeName, ...options?.dialogOptions };

    const valueFn = (typeof value === "function" ? value : () => value) as (btn: TranslationButtonComp<TItem>) => TItem;
    let translationFn = (typeof translation === "function" ? translation : () => translation) as (btn: TranslationButtonComp<TItem>, lang: string) => TItem;

    if (!translationFn) {
        if (options.strategy === "link") {
            throw new Error("translation function is required for link strategy");
        } else translationFn = (btn, lang) => btn.item()["translations"]?.find((t) => t.lang === lang);
    }
    const inputs = { formViewModel, dialogOptions, btn, valueFn, translationFn, baseLocale: options.baseLocale, locale: options.locale, updateAdapter: options.updateAdapter };
    return {
        component: options?.strategy === "embed" ? EmbedTranslationButton<TItem> : LinkTranslationButton<TItem>,
        inputs,
    } as DynamicComponent<TranslationButtonComp<TItem>>;
}
