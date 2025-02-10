import { Component, inject, Injector, input, runInInjectionContext } from "@angular/core";
import { Class, ObjectId } from "@noah-ark/common";
import { ActionDescriptor, DynamicComponent, provideComponent, toTitleCase } from "@upupa/common";
import { DataAdapter } from "@upupa/data";
import { MatBtnComponent } from "@upupa/mat-btn";
import { DialogConfig, DialogService } from "@upupa/dialog";
import { firstValueFrom } from "rxjs";

import { NgControl } from "@angular/forms";
import { DataFormComponent, reflectFormViewModelType } from "@upupa/dynamic-form";
import { cloneDeep } from "lodash";

@Component({
    standalone: true,
    selector: "embed-translation-btn",
    template: ` @if (item()["lang"] !== locale().code) {
        <mat-btn (action)="translate()" [buttonDescriptor]="btn()"></mat-btn>
    }`,
    imports: [MatBtnComponent],
})
export class EmbedTranslationButton<TItem = unknown> {
    injector = inject(Injector);
    adapter = inject(DataAdapter, { optional: true });

    item = input<TItem>(); //from cell template
    data = input<(btn: EmbedTranslationButton<TItem>) => TItem>(() => this.item());
    dialogOptions = input<any>({ title: "Create" });
    btn = input<ActionDescriptor>({ name: "translate", color: "primary", icon: "translate", variant: "raised" });
    locale = input.required<{ nativeName: string; code: string }>();
    formViewModel = input<Class<TItem>>();
    updateAdapter = input<boolean>(false);

    async translate() {
        const dialogOptions = this.dialogOptions() ?? {};
        runInInjectionContext(this.injector, async () => {
            const _injector = inject(Injector);
            const injector = Injector.create({ providers: [{ provide: NgControl, useValue: undefined }], parent: _injector }); // disconnect parent form control (dialog form will start a new control context)
            const dialog = inject(DialogService);
            const mirror = { ...reflectFormViewModelType(this.formViewModel()), actions: [] };

            const value = this.data()?.(this) ?? this.item() ?? new mirror.viewModelType();
            const v = await value;
            const { code, nativeName } = this.locale();
            const _translations = Array.isArray(v.translations)
                ? cloneDeep(v.translations)
                : Object.entries(v.translations).map(([lang, value]: [string, any]) => ({ ...value, lang }));
            const _value = Object.assign(
                {},
                v,
                _translations.find((t) => t.lang === code),
            );
            const translations = cloneDeep(_value.translations);
            delete _value._id;
            delete _value.translations; // to prevent json circular reference

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
                    title: `${nativeName} Translation`,
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
                                    const res = await dataFormComponent.onSubmit();
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
    standalone: true,
    selector: "link-translation-btn",
    template: ` @if (item()["lang"] !== locale().code) {
        <mat-btn (action)="translate()" [buttonDescriptor]="btn()"></mat-btn>
    }`,
    imports: [MatBtnComponent],
})
export class LinkTranslationButton<TItem = unknown> {
    injector = inject(Injector);
    adapter = inject(DataAdapter, { optional: true });

    item = input<TItem>(); //from cell template
    data = input<(btn: EmbedTranslationButton<TItem>) => TItem>(() => this.item());
    dialogOptions = input<any>({ title: "Create" });
    btn = input<ActionDescriptor>({ name: "translate", color: "primary", icon: "translate", variant: "raised" });
    locale = input.required<{ nativeName: string; code: string }>();
    formViewModel = input<Class<TItem>>();
    updateAdapter = input<boolean>(false);

    async translate() {
        const dialogOptions = this.dialogOptions() ?? {};
        runInInjectionContext(this.injector, async () => {
            const _injector = inject(Injector);
            const injector = Injector.create({ providers: [{ provide: NgControl, useValue: undefined }], parent: _injector }); // disconnect parent form control (dialog form will start a new control context)
            const dialog = inject(DialogService);
            const mirror = { ...reflectFormViewModelType(this.formViewModel()), actions: [] };

            const value = this.data()?.(this) ?? this.item() ?? new mirror.viewModelType();
            const v = await value;
            const { code, nativeName } = this.locale();
            const _value = Object.assign({}, v, { _id: ObjectId.generate(), lang: code });
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
                    title: `${nativeName} Translation`,
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
                                    const res = await dataFormComponent.onSubmit();
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
                await this.adapter.create({ ...submitResult, lang: code, translation_id });
                await this.adapter.patch(this.item(), [{ op: "replace", path: "translation_id", value: translation_id }]);
            }
        });
    }
}

export function translateButton<TItem = unknown>(
    formViewModel: Class,
    value: TItem | ((btn: EmbedTranslationButton<TItem>) => TItem) = () => new formViewModel(),
    options: {
        dialogOptions?: Partial<DialogConfig>;
        updateAdapter?: boolean;
        translationStrategy: "link" | "embed";
        locale: { nativeName: string; code: string };
    },
): DynamicComponent<EmbedTranslationButton<TItem>> {
    const defaultCreateDescriptor: Partial<ActionDescriptor> = {
        text: toTitleCase(options.locale.code),
        variant: "stroked",
        color: "primary",
        type: "button",
    };
    const btn = { ...defaultCreateDescriptor } as ActionDescriptor;
    const dialogOptions = { title: "Translate", ...options?.dialogOptions };

    const data = (typeof value === "function" ? value : () => value) as (btn: EmbedTranslationButton<TItem>) => TItem;
    if (options.translationStrategy === "embed")
        return {
            component: EmbedTranslationButton<TItem>,
            inputs: { formViewModel, dialogOptions, btn, data, locale: options.locale, updateAdapter: options.updateAdapter },
        };
    if (options.translationStrategy === "link")
        return {
            component: LinkTranslationButton<TItem>,
            inputs: { formViewModel, dialogOptions, btn, data, locale: options.locale, updateAdapter: options.updateAdapter },
        };
    throw new Error(`Invalid translation strategy ${options.translationStrategy}`);
}
