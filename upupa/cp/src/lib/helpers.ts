import { Component, input, inject, Type, Injector, signal, ComponentRef, OutputEmitterRef, runInInjectionContext, output, effect, InjectionToken, Signal } from "@angular/core";
import { ActionDescriptor, ActionEvent, DynamicComponent } from "@upupa/common";
import { ConfirmOptions, ConfirmService, DialogService, DialogServiceConfig, SnackBarService } from "@upupa/dialog";
import { MatBtnComponent } from "@upupa/mat-btn";
import { DataTableComponent, injectDataAdapter, injectRowItem } from "@upupa/table";
import { firstValueFrom } from "rxjs";
import { DataFormWithViewModelComponent } from "./data-form-with-view-model/data-form-with-view-model.component";
import { ClientDataSource, DataAdapter, DataService, NormalizedItem } from "@upupa/data";
import { Class } from "@noah-ark/common";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatIconModule } from "@angular/material/icon";
import { run } from "node:test";

function merge<T, X>(a: Partial<T>, b: Partial<T>): Partial<T & X> {
    return { ...a, ...b } as Partial<T & X>;
}

@Component({
    selector: "create-button",
    imports: [MatBtnComponent],
    standalone: true,
    template: ` <mat-btn [descriptor]="buttonDescriptor()" (onClick)="onClick($event)"></mat-btn> `,
    styles: [],
})
export class CreateButtonComponent {
    viewModel = input.required<Class>();
    value = input<any>(null);
    buttonDescriptor = input.required<ActionDescriptor>();
    options = input.required<{
        handler: () => Promise<any>;
    }>();
    dialog = inject(DialogService);

    readonly injector = inject(Injector);
    private readonly table = inject(DataTableComponent);
    async onClick(e: ActionEvent) {
        const callable = editFormDialog.bind(this);
        runInInjectionContext(this.injector, () => callable(this.viewModel()));

        // const vm = this.viewModel();

        // const ref = this.dialog.openDialog(DataFormWithViewModelComponent, {
        //     title: 'Create',
        //     inputs: { viewModel: vm },
        // });

        // const result = await firstValueFrom(ref.afterClosed());
        // const adapter = this.table.adapter();
        // if (adapter.dataSource instanceof ClientDataSource) {
        //     adapter.dataSource.all = [...adapter.dataSource.all, result];
        // } else this.table.adapter().refresh();
    }
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

export function inlineButton(options: { descriptor?: Partial<ActionDescriptor>; item: any; handler: (instance) => void }): Type<any> | DynamicComponent {
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
    options?: { descriptor?: Partial<ActionDescriptor>; dialogOptions?: Partial<DialogServiceConfig> },
): Type<any> | DynamicComponent {
    if (!formViewModel) throw new Error("formViewModel is required");
    options ??= {};
    const defaultCreateDescriptor: Partial<ActionDescriptor> = {
        text: "Create",
        icon: "add",
        color: "primary",
        variant: "raised",
    };
    options.descriptor = merge(defaultCreateDescriptor, options.descriptor);

    return inlineButton({
        descriptor: options.descriptor,
        handler: (source) => editFormDialog.call(source, formViewModel, readInput("item", source), { dialogOptions: options.dialogOptions }),
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
        handler: (source) => {
            const item = readInput("item", source);
            const v = value ? value() : item;
            editFormDialog.call(source, formViewModel, v, { dialogOptions: options.dialogOptions });
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
    if (error) snack.openFailed(typeof error === "object" ? (error.message ?? error.error.message) : error, error);
    else dialogRef.close(submitResult);
}

async function openFormDialog<T>(vm: Class, value: any, context?: { injector?: Injector; dialogOptions?: DialogServiceConfig }) {
    const dialog = context?.injector?.get(DialogService) ?? inject(DialogService);
    const opts = { ...context?.dialogOptions };
    const dRef = dialog.openDialog(DataFormWithViewModelComponent, {
        ...opts,
        inputs: { ...opts.inputs, viewModel: vm, value },
    });
    const component: ComponentRef<DataFormWithViewModelComponent> = await firstValueFrom(dRef["afterAttached"]());

    return { dialogRef: dRef, componentRef: component };
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
    if (!adapter) throw new Error("DataAdapter not found");
    if (!(adapter.dataSource instanceof ClientDataSource)) throw new Error("DataAdapter is not a ClientDataSource");
    adapter.dataSource.all = adapter.dataSource.all.filter((i) => i !== item);
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

@Component({
    selector: "delete-button",
    imports: [MatBtnComponent, MatProgressSpinnerModule, MatIconModule],
    standalone: true,
    template: `
        <mat-btn [descriptor]="buttonDescriptor()" (onClick)="onClick($event)">
            @if (deleting()) {
                <mat-spinner class="spinner" mode="indeterminate" [diameter]="20" [color]="buttonDescriptor().color"></mat-spinner>
            }
        </mat-btn>
    `,
    styles: [],
})
export class DeleteButtonComponent<T = any> {
    deleting = signal(false);
    buttonDescriptor = input.required<ActionDescriptor>();
    options = input<(selected: any) => { path?: string } & ConfirmOptions, (selected: any) => Partial<{ path: string } & ConfirmOptions>>(undefined, {
        transform: (fn) => {
            return (selected: any) => ({
                title: "Delete",
                confirmText: "Are you sure you want to delete this item?",
                no: "Keep it",
                yes: "Delete",
                ...fn?.(selected),
            });
        },
    });
    element = input<NormalizedItem<T>>(null);

    private readonly confirm = inject(ConfirmService);
    private readonly table = inject(DataTableComponent);
    private readonly injector = inject(Injector);
    async onClick(e: ActionEvent) {
        const options = this.options()(this.element().item);

        const confirmed = await this.confirm.openWarning(options);

        if (!confirmed) return;
        this.deleting.set(true);

        const ds = this.injector.get(DataService);

        try {
            const adapter = this.table.adapter();
            if (adapter.dataSource instanceof ClientDataSource) {
                const item = this.element().item;
                adapter.dataSource.all = adapter.dataSource.all.filter((i) => i !== item);
            } else {
                const path = options.path;
                if (!path || path.trim().length === 0) throw new Error("Path is required");
                await ds.delete(path);
            }
        } catch (e) {
            console.error(e);
        } finally {
            this.deleting.set(false);
        }
    }
}
