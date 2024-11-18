import { Component, input, inject, Type, Injector, signal, ComponentRef, OutputEmitterRef, runInInjectionContext, output, effect, InjectionToken, Signal } from "@angular/core";
import { ActionDescriptor, ActionEvent, DynamicComponent } from "@upupa/common";
import { ConfirmOptions, ConfirmService, DialogService, DialogServiceConfig, SnackBarService, UpupaDialogComponent } from "@upupa/dialog";
import { MatBtnComponent } from "@upupa/mat-btn";
import { DataTableComponent, injectDataAdapter, injectRowItem } from "@upupa/table";
import { firstValueFrom } from "rxjs";
import { DataFormWithViewModelComponent } from "./data-form-with-view-model/data-form-with-view-model.component";
import { ClientDataSource, DataAdapter, DataService, NormalizedItem } from "@upupa/data";
import { Class } from "@noah-ark/common";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatIconModule } from "@angular/material/icon";
import { reflectFormViewModelType } from "@upupa/dynamic-form";

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

export function inlineButton(options: { descriptor?: Partial<ActionDescriptor>; item: any; handler: (instance) => void }): DynamicComponent {
    const template = {
        component: InlineButtonComponent,
        inputs: {
            item: options.item,
            buttonDescriptor: options.descriptor,
        },
        outputs: {
            clicked: (source, e) => {
                runInInjectionContext(source.injector, () => options.handler(source.instance));
            },
        },
    } as DynamicComponent;
    return template;
}

export function createButton(
    formViewModel: Class,
    value?: () => any | Promise<any>,
    options?: { descriptor?: Partial<ActionDescriptor>; dialogOptions?: Partial<DialogServiceConfig> },
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
        handler: async (source) => {
            const injector = inject(Injector);
            const item = readInput("item", source);
            const v = value ? value() : item;
            const dialogOptions = { title: "Edit", ...options?.dialogOptions };
            const result = await editFormDialog.call(source, formViewModel, v, { dialogOptions });

            const adapter = injector.get(DataAdapter);
            adapter?.create(result.submitResult);
            adapter?.refresh(true);
        },
        item: null,
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
        dialogOptions?: Partial<DialogServiceConfig>;
    },
): Type<any> | DynamicComponent {
    if (!formViewModel) throw new Error("formViewModel is required");
    options ??= {};
    const defaultEditDescriptor: Partial<ActionDescriptor> = {
        text: "Edit",
        icon: "edit",
        variant: "icon",
        color: "accent",
    };
    options.descriptor = merge(defaultEditDescriptor, options.descriptor);

    return inlineButton({
        descriptor: options.descriptor,
        handler: async (source) => {
            const injector = inject(Injector);
            const item = readInput("item", source);
            const v = value ? value() : item;
            const dialogOptions = { title: "Edit", ...options?.dialogOptions };
            const result = await editFormDialog.call(source, formViewModel, v, { dialogOptions });

            const adapter = injector.get(DataAdapter);
            adapter?.put(item, result.submitResult);
            adapter?.refresh(true);
        },
        item: null,
    });
}

async function editFormDialog<T>(vm: Class, value = readInput("item", this), context?: { dialogOptions?: DialogServiceConfig }) {
    const snack = inject(SnackBarService);
    const injector = inject(Injector);
    const v = await value;
    const { componentRef, dialogRef } = await openFormDialog<T>(vm, v, { injector, dialogOptions: context?.dialogOptions });
    const { submitResult, error } = await waitForOutput<DataFormWithViewModelComponent["submitted"]>("submitted", componentRef.instance);

    if (error) {
        snack.openFailed(typeof error === "object" ? (error.message ?? error.error.message) : error, error);
    } else {
        dialogRef.close(submitResult);
    }

    return { submitResult, error };
}

async function openFormDialog<T>(vm: Class, value: any, context?: { injector?: Injector; dialogOptions?: DialogServiceConfig }) {
    const dialog = context?.injector?.get(DialogService) ?? inject(DialogService);
    const opts: DialogServiceConfig = {
        dialogActions: [{ text: "Submit", type: "submit", color: "primary" } as ActionDescriptor],
        ...context?.dialogOptions,
    };
    const mirror = reflectFormViewModelType(vm);
    const dialogRef = dialog.openDialog(
        { component: DataFormWithViewModelComponent, injector: context?.injector },
        {
            ...opts,
            inputs: { ...opts.inputs, viewModel: mirror, value },
        },
    );
    const componentRef: ComponentRef<DataFormWithViewModelComponent> = await firstValueFrom(dialogRef["afterAttached"]());
    const dialogWrapper = dialogRef.componentInstance as UpupaDialogComponent;
    const actions = dialogWrapper.dialogActions;
    const submitAction = actions().find((a) => a.type === "submit");

    actions.set([{ ...submitAction, disabled: componentRef.instance.form().status === "INVALID" }]);
    componentRef.instance.form().statusChanges.subscribe((status) => {
        actions.set([{ ...submitAction, disabled: status === "INVALID" }]);
    });

    dialogWrapper.actionClick.subscribe((e) => {
        if (e.action.type === "submit") {
            componentRef.instance.dynamicFormEl().ngSubmit();
        }
    });

    return { dialogRef, componentRef };
}

type ExtractEventType<T> = T extends OutputEmitterRef<infer R> ? R : never;
async function waitForOutput<T extends OutputEmitterRef<R>, R = ExtractEventType<T>>(output: string, instance = this): Promise<R> {
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

export function deleteValueFromAdapter(item: any) {
    const adapter = inject(DataAdapter);
    if (!adapter) throw new Error("DataAdapter is required");
    adapter.delete(item);
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
        handler: (source) => {
            // const item = readInput('item', source);
            deleteItem.call(source, confirmOptions, deleteFn);
        },
        item: null,
    });
}
