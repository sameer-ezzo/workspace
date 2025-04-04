import { Component, inject, Injector, input, output, runInInjectionContext } from "@angular/core";
import { Class } from "@noah-ark/common";
import { ActionDescriptor, ComponentOutputs, ComponentOutputsHandlers, DynamicComponent } from "@upupa/common";
import { MatBtnComponent } from "@upupa/mat-btn";
import { openFormDialog } from "./helpers";
import { DialogConfig } from "@upupa/dialog";
import { firstValueFrom } from "rxjs";
import { reflectFormViewModelType, SubmitResult } from "@upupa/dynamic-form";
import { ITableCellTemplate } from "@upupa/table";

@Component({
    selector: "edit-btn",
    template: ` <mat-btn (action)="openDialog()" [buttonDescriptor]="btn()"></mat-btn>`,
    imports: [MatBtnComponent]
})
export class FormDialogButton<TItem = unknown> implements ITableCellTemplate {
    injector = inject(Injector);

    item = input<TItem>(); //from cell template
    data = input<(btn: FormDialogButton<TItem>) => TItem>(() => this.item());
    dialogOptions = input<any>({});
    btn = input<ActionDescriptor>({ name: "_", color: "primary", variant: "raised" });
    formViewModel = input<Class<TItem>>();

    submit = output<SubmitResult<TItem>>();
    success = output<TItem>();
    error = output<Error>();
    cancel = output<void>();

    async openDialog() {
        const dialogOptions = this.dialogOptions();
        const mirror = reflectFormViewModelType(this.formViewModel());
        const value = await runInInjectionContext(this.injector, async () => {
            return (await this.data()?.(this)) ?? this.item() ?? new mirror.viewModelType();
        });

        const { dialogRef, componentRef } = await openFormDialog<Class, TItem>(this.formViewModel(), value, { dialogOptions, defaultAction: true, injector: this.injector });
        const sub = componentRef.instance.submitted.subscribe((result: SubmitResult<TItem>) => {
            this.submit.emit(result);
            if (result?.submitResult) {
                const { submitResult } = result;
                sub.unsubscribe();
                dialogRef.close(result);
                this.success.emit(submitResult);
            } else if (result?.error) this.error.emit(result.error);
            else this.cancel.emit();
        });
    }
}

export function formDialogButton<TItem = unknown>(
    formViewModel: Class,
    value: TItem | ((btn: FormDialogButton<TItem>) => TItem) = () => new formViewModel(),
    options?: {
        descriptor?: Partial<ActionDescriptor>;
        dialogOptions?: Partial<DialogConfig>;
        updateAdapter?: boolean;
        outputs?: ComponentOutputsHandlers<FormDialogButton<TItem>>;
    },
): DynamicComponent<FormDialogButton<TItem>> {
    options ??= {};
    const data = (typeof value === "function" ? value : () => value) as (btn: FormDialogButton<TItem>) => TItem;
    const dialogOptions = options?.dialogOptions ?? {};
    const btn: ActionDescriptor = { ...options?.descriptor } as ActionDescriptor;
    return {
        component: FormDialogButton<TItem>,
        inputs: { formViewModel, dialogOptions, btn, data },
        outputs: options?.outputs,
    };
}

export function createButton<TItem = unknown>(
    formViewModel: Class,
    value: TItem | ((btn: FormDialogButton<TItem>) => TItem) = () => new formViewModel(),
    options?: {
        descriptor?: Partial<ActionDescriptor>;
        dialogOptions?: Partial<DialogConfig>;
        updateAdapter?: boolean;
        outputs?: ComponentOutputsHandlers<FormDialogButton<TItem>>;
    },
): DynamicComponent<FormDialogButton<TItem>> {
    const defaultCreateDescriptor: Partial<ActionDescriptor> = {
        text: "Create",
        icon: "add",
        variant: "raised",
        color: "primary",
        type: "button",
    };
    const btn = { ...defaultCreateDescriptor, ...options?.descriptor } as ActionDescriptor;
    const dialogOptions = { title: "Create", ...options?.dialogOptions };
    return formDialogButton<TItem>(formViewModel, value, { descriptor: btn, dialogOptions, updateAdapter: options?.updateAdapter, outputs: options?.outputs });
}

export function editButton<TItem = unknown>(
    formViewModel: Class,
    value: TItem | ((btn: FormDialogButton<TItem>) => TItem) = (btn) => btn.item(),
    options?: {
        descriptor?: Partial<ActionDescriptor>;
        dialogOptions?: Partial<DialogConfig>;
        updateAdapter?: boolean;
        outputs?: ComponentOutputsHandlers<FormDialogButton<TItem>>;
    },
): DynamicComponent<FormDialogButton<TItem>> {
    options ??= {};
    const defaultEditDescriptor: Partial<ActionDescriptor> = {
        text: "Edit",
        icon: "edit",
        variant: "icon",
        color: "accent",
        type: "button",
    };
    const btn = { ...defaultEditDescriptor, ...options?.descriptor } as ActionDescriptor;
    const dialogOptions = { title: "Edit", ...options?.dialogOptions };

    return formDialogButton<TItem>(formViewModel, value, { descriptor: btn, dialogOptions, updateAdapter: options?.updateAdapter, outputs: options?.outputs });
}
