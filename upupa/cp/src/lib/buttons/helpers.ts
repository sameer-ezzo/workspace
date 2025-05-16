import { Component, input, inject, Type, Injector, runInInjectionContext, output, viewChild } from "@angular/core";
import { ActionDescriptor, ActionEvent, DynamicComponent } from "@upupa/common";
import { ConfirmOptions, ConfirmService, DialogConfig, SnackBarService } from "@upupa/dialog";
import { MatBtnComponent } from "@upupa/mat-btn";
import { firstValueFrom } from "rxjs";
import { DataAdapter, DataService } from "@upupa/data";
import { Class } from "@noah-ark/common";
import { EmbedTranslationButton, LinkTranslationButton, translateButton, TranslationButtonComp } from "./translate-btn.component";
import { injectDataAdapter, injectRowItem } from "@upupa/table";

@Component({
    selector: "inline-button",
    imports: [MatBtnComponent],
    template: ` <mat-btn #btn [buttonDescriptor]="buttonDescriptor()" (action)="onClick($event)"></mat-btn> `,
    styles: [],
})
export class InlineButtonComponent {
    buttonDescriptor = input.required<ActionDescriptor>();
    item = input<any>(null);
    clicked = output<{ e: ActionEvent; instance: InlineButtonComponent; btn: MatBtnComponent }>();
    btn = viewChild(MatBtnComponent);
    async onClick(e: ActionEvent) {
        this.clicked.emit({ e, instance: this, btn: this.btn() });
    }
}

export function inlineButton<T = unknown>(options: {
    descriptor?: Partial<ActionDescriptor>;
    inputItem?: T;
    clickHandler: (btnInstance: InlineButtonComponent) => void;
}): DynamicComponent {
    const template = {
        component: InlineButtonComponent,
        inputs: {
            item: options.inputItem,
            buttonDescriptor: options.descriptor,
        },
        outputs: {
            clicked: (source, e) => {
                runInInjectionContext(source.injector, () => options.clickHandler(source.instance));
            },
        },
    } as DynamicComponent;
    return template;
}

export function readValueFromApi<T = any>(path: string) {
    const ds = inject(DataService);
    return firstValueFrom(ds.get<T>(path)).then((r) => r.data?.[0] as T);
}

export type ExtractViewModel<T> = T extends Class<infer R> ? R : any;

export function translationButtons<TItem = unknown>(
    formViewModel: Class,
    strategy: "link" | "embed",
    baseLocale: { nativeName: string; code: string },
    locales: { nativeName: string; code: string }[],

    value: TItem | ((btn: EmbedTranslationButton<TItem> | LinkTranslationButton<TItem>) => TItem),
    translation: TItem | ((btn: EmbedTranslationButton<TItem> | LinkTranslationButton<TItem>, lang: string) => TItem),
    options?: {
        dialogOptions?: Partial<DialogConfig>;
    },
): DynamicComponent<TranslationButtonComp<TItem>>[] {
    if (!formViewModel) throw new Error("formViewModel is required");
    const ls = [baseLocale, ...(locales ?? [])];
    return ls.map((locale) =>
        translateButton(formViewModel, value, translation, {
            locale,
            baseLocale: baseLocale,
            strategy,
            dialogOptions: options?.dialogOptions,
        }),
    );
}

export function openConfirmationDialog(options: ConfirmOptions): Promise<boolean> {
    const confirm = inject(ConfirmService);
    return confirm.openWarning(options);
}

async function deleteItem<T>(confirmOptions: ConfirmOptions, deleteFn: () => any | Promise<any>) {
    const snack = inject(SnackBarService);
    const injector = inject(Injector);
    if (!(await openConfirmationDialog(confirmOptions))) return;
    try {
        runInInjectionContext(injector, async () => {
            return await deleteFn?.();
        });
    } catch (error) {
        snack.openFailed("", error);
    }
}

export function deleteValueFromAdapter(item: any) {
    const adapter = inject(DataAdapter);
    return adapter.delete(item, { refresh: true });
}
export function deleteValueFromApi(path: string) {
    const ds = inject(DataService);
    return ds.delete(path);
}

export function deleteButton(
    deleteFn: () => any | Promise<any> = (adapter = injectDataAdapter()) => adapter.delete(injectRowItem()),
    options?: {
        confirm?: ConfirmOptions;
        descriptor?: Partial<ActionDescriptor>;
    },
): Type<any> | DynamicComponent {
    options ??= {};
    const defaultDeleteDescriptor: Partial<ActionDescriptor> = {
        text: "Delete",
        icon: "delete",
        variant: "icon",
        color: "warn",
    };
    options.descriptor = { ...defaultDeleteDescriptor, ...options.descriptor };

    const confirmOptions = { ...{ title: "Delete", confirmText: "Are you sure you want to delete this item?", no: "Keep it", yes: "Delete" }, ...options?.confirm };
    return inlineButton({
        descriptor: options.descriptor,
        clickHandler: (source) => {
            // const item = readInput('item', source);
            deleteItem.call(source, confirmOptions, deleteFn);
        },
        inputItem: null,
    });
}
