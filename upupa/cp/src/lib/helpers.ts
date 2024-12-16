import { Component, input, inject, Type, Injector, ComponentRef, OutputEmitterRef, runInInjectionContext, output } from "@angular/core";
import { ActionDescriptor, ActionEvent, DynamicComponent } from "@upupa/common";
import { ConfirmOptions, ConfirmService, DialogService, DialogConfig, SnackBarService, DialogWrapperComponent } from "@upupa/dialog";
import { MatBtnComponent } from "@upupa/mat-btn";
import { injectDataAdapter, injectRowItem } from "@upupa/table";
import { firstValueFrom } from "rxjs";
import { DataFormWithViewModelComponent } from "./data-form-with-view-model/data-form-with-view-model.component";
import { DataAdapter, DataService } from "@upupa/data";
import { Class } from "@noah-ark/common";
import { FormViewModelMirror, reflectFormViewModelType } from "@upupa/dynamic-form";
import { EditButton } from "./buttons/edit-btn.component";

function merge<T, X>(a: Partial<T>, b: Partial<T>): Partial<T & X> {
    return { ...a, ...b } as Partial<T & X>;
}

@Component({
    selector: "inline-button",
    imports: [MatBtnComponent],
    standalone: true,
    template: ` <mat-btn [descriptor]="buttonDescriptor()" (onClick)="onClick($event)"></mat-btn> `,
    styles: [],
})
export class InlineButtonComponent {
    buttonDescriptor = input.required<ActionDescriptor>();
    item = input<any>(null);
    clicked = output();

    async onClick(e: ActionEvent) {
        this.clicked.emit();
    }
}

export function inlineButton<T = unknown>(options: { descriptor?: Partial<ActionDescriptor>; inputItem?: T; clickHandler: (btnInstance) => void }): DynamicComponent {
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

export async function createButtonHandler(
    sourceComponent: any,
    formViewModel: Class,
    value?: () => any | Promise<any>,
    options?: { descriptor?: Partial<ActionDescriptor>; dialogOptions?: Partial<DialogConfig>; injector?: Injector },
) {
    const injector = options?.injector ?? inject(Injector);
    const v = value ? value() : readInput("item", sourceComponent);
    const dialogOptions = { title: "Create", ...options?.dialogOptions };
    const result = await editFormDialog.call(sourceComponent, formViewModel, v, { dialogOptions, defaultAction: true, injector });

    const adapter = injector.get(DataAdapter);
    adapter?.create(result.submitResult);
    adapter?.refresh(true);
    return result;
}

export function createButton(
    formViewModel: Class,
    value?: () => any | Promise<any>,
    options?: { descriptor?: Partial<ActionDescriptor>; dialogOptions?: Partial<DialogConfig> },
): DynamicComponent {
    if (!formViewModel) throw new Error("formViewModel is required");
    const btnDescriptor: Partial<ActionDescriptor> = {
        text: "Create",
        icon: "add",
        color: "primary",
        variant: "raised",
    };

    return inlineButton({
        descriptor: merge(btnDescriptor, options?.descriptor),
        clickHandler: async (source) => createButtonHandler(source, formViewModel, value, options),
        inputItem: null,
    });
}

export function readValueFromApi<T = any>(path: string) {
    const ds = inject(DataService);
    return firstValueFrom(ds.get<T>(path)).then((r) => r.data?.[0] as T);
}
export function editButton(
    formViewModel: Class,
    value?: () => any | Promise<any>,
    options?: {
        descriptor?: Partial<ActionDescriptor>;
        dialogOptions?: Partial<DialogConfig>;
    },
): Type<any> | DynamicComponent {
    // if (!formViewModel) throw new Error("formViewModel is required");
    // options ??= {};
    // const defaultEditDescriptor: Partial<ActionDescriptor> = {
    //     text: "Edit",
    //     icon: "edit",
    //     variant: "icon",
    //     color: "accent",
    // };
    // options.descriptor = merge(defaultEditDescriptor, options.descriptor);

    // return inlineButton({
    //     descriptor: options.descriptor,
    //     clickHandler: async (source) => {
    //         const injector = inject(Injector);
    //         const item = readInput("item", source);
    //         const v = value ? value() : item;
    //         const dialogOptions = { title: "Edit", ...options?.dialogOptions };
    //         const result = await editFormDialog.call(source, formViewModel, v, { dialogOptions, defaultAction: true });

    //         const adapter = injector.get(DataAdapter);
    //         adapter?.put(item, result.submitResult);
    //         adapter?.refresh(true);
    //     },
    //     inputItem: null,
    // });

    options ??= {};
    const defaultEditDescriptor: Partial<ActionDescriptor> = {
        text: "Edit",
        icon: "edit",
        variant: "icon",
        color: "accent",
    };
    const btn = merge(defaultEditDescriptor, options.descriptor);
    const dialogOptions = { title: "Edit", ...options?.dialogOptions };

    return {
        component: EditButton,
        inputs: { formViewModel, dialogOptions, btn },
    };
}

export async function editFormDialog<T>(
    vm: Class | FormViewModelMirror,
    value = readInput("item", this),
    context?: { dialogOptions?: DialogConfig; injector?: Injector; defaultAction?: ActionDescriptor | boolean },
) {
    const injector = context?.injector ? context.injector : inject(Injector);
    const snack = injector.get(SnackBarService);

    const v = await value;
    const { componentRef, dialogRef } = await openFormDialog<T>(vm, v, { injector, dialogOptions: context?.dialogOptions, defaultAction: context?.defaultAction });
    const { submitResult, error } = await waitForOutput<DataFormWithViewModelComponent["submitted"]>("submitted", componentRef.instance);

    if (error) {
        snack.openFailed(typeof error === "object" ? (error.message ?? error.error.message) : error, error);
    } else {
        dialogRef.close(submitResult);
    }

    return { submitResult, error };
}

export async function openFormDialog<T>(
    vm: Class | FormViewModelMirror,
    value: any,
    context: { injector?: Injector; dialogOptions?: DialogConfig; defaultAction?: ActionDescriptor | boolean } = {},
) {
    const dialog = context?.injector?.get(DialogService) ?? inject(DialogService);
    const _mirror = "viewModelType" in vm ? vm : reflectFormViewModelType(vm);
    const mirror = { ..._mirror, actions: [] };

    // let formActions = [...(_mirror.actions ?? []), ...(context.dialogOptions?.dialogActions ?? [])];
    let formActions = [...(_mirror.actions ?? [])];
    let defaultAction = formActions.find((x) => x.type === "submit");
    if (context.defaultAction && !defaultAction) {
        //defaultAction = context.defaultAction === true ? ({ text: "Submit", icon: "save", color: "primary", type: "submit" } as ActionDescriptor) : context.defaultAction;
        formActions = [defaultAction, ...formActions];
    }
    const opts: DialogConfig = {
        ...context?.dialogOptions,
        // dialogActions: [...(context?.dialogOptions?.dialogActions ?? []), ...formActions],
    };

    const dialogRef = dialog.open({ component: DataFormWithViewModelComponent, inputs: { viewModel: mirror, value }, injector: context?.injector }, opts);

    const componentRef: ComponentRef<DataFormWithViewModelComponent> = await firstValueFrom(dialogRef.afterAttached());
    const dialogWrapper = dialogRef.componentInstance;
    const form = componentRef.instance.dynamicFormEl().form;
    form.statusChanges.subscribe((status) => {
        // dialogWrapper.dialogActions.update((actions) => actions.map((a) => (a.type === "submit" ? { ...a, disabled: status === "INVALID" } : a)));
    });
    form.updateValueAndValidity(); // to trigger initial form status

    // dialogWrapper.actionClick.subscribe((e) => {
    //     componentRef.instance.onAction(e);
    // });

    return { dialogRef, componentRef };
}

export function translationButtons(
    formViewModel: Class,
    value?: () => any | Promise<any>,
    options?: {
        locales: { nativeName: string; code: string }[];
        dialogOptions?: Partial<DialogConfig>;
    },
): DynamicComponent[] {
    if (!formViewModel) throw new Error("formViewModel is required");

    return (options?.locales ?? []).map((locale) => {
        const descriptor = {
            name: locale.code,
            text: locale.nativeName ?? locale.code,
            icon: "translate",
        };
        return inlineButton({
            descriptor: descriptor,
            clickHandler: async (source) => {
                const dialogOptions = { title: `${locale.nativeName}`, ...options?.dialogOptions };
                const adapter = injectDataAdapter();
                const injector = inject(Injector);
                const item = readInput("item", source);
                const v = await (value ? value() : item);

                const _value = Object.assign({}, v, v.translations?.[locale.code]);
                const translations = Object.assign({}, _value.translations);
                delete _value.translations; // to prevent json circular reference

                const mirror = reflectFormViewModelType(formViewModel);
                mirror.viewModelType = Object; // to prevent view model submit handler
                mirror.actions = [];
                const { submitResult, error } = await editFormDialog.call(source, mirror, _value, {
                    dialogOptions,
                    injector,
                    defaultAction: {
                        text: "Translate",
                        icon: "translate",
                        color: "primary",
                        type: "submit",
                    },
                });
                if (error) return;

                translations[locale.code] = submitResult;
                v.translations = translations;
                await adapter.put(item, v);

                await adapter.refresh();
            },
            inputItem: null,
        });
    });
}

type ExtractEventType<T> = T extends OutputEmitterRef<infer R> ? R : never;
export async function waitForOutput<T extends OutputEmitterRef<R>, R = ExtractEventType<T>>(output: string, instance = this): Promise<R> {
    const emitter = instance[output] as T;
    if (!emitter) throw new Error(`Output ${output} not found in ${instance.constructor.name}`);
    return new Promise<R>((resolve) => {
        const sub = emitter.subscribe((e) => {
            sub.unsubscribe();
            resolve(e);
        });
    });
}

function readInput(input: string, instance = this) {
    if (!(input in instance)) throw new Error(`Input ${input} not found in ${instance.constructor.name}`);
    const inputRef = instance[input];
    if (typeof inputRef === "function") return inputRef();
    return inputRef;
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
    options.descriptor = merge(defaultDeleteDescriptor, options.descriptor);

    const confirmOptions = merge({ title: "Delete", confirmText: "Are you sure you want to delete this item?", no: "Keep it", yes: "Delete" }, options?.confirm ?? {});
    return inlineButton({
        descriptor: options.descriptor,
        clickHandler: (source) => {
            // const item = readInput('item', source);
            deleteItem.call(source, confirmOptions, deleteFn);
        },
        inputItem: null,
    });
}
