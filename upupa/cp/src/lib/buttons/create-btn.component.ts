import { Component, inject, Injector, input, runInInjectionContext } from "@angular/core";
import { Class } from "@noah-ark/common";
import { ActionDescriptor, DynamicComponent } from "@upupa/common";
import { DataAdapter } from "@upupa/data";
import { MatBtnComponent } from "@upupa/mat-btn";
import { ITableCellTemplate } from "@upupa/table";
import { openFormDialog, waitForOutput } from "../helpers";
import { DialogConfig, DialogRef } from "@upupa/dialog";
import { firstValueFrom } from "rxjs";
import { reflectFormViewModelType } from "@upupa/dynamic-form";
import { injectFormViewModel } from "../data-form-with-view-model/data-form-with-view-model.component";

@Component({
    standalone: true,
    selector: "edit-btn",
    template: ` <mat-btn (onClick)="create()" [descriptor]="btn()"></mat-btn>`,
    imports: [MatBtnComponent],
})
export class CreateButton<TValue = unknown, TItem = unknown> implements ITableCellTemplate<TValue, TItem> {
    injector = inject(Injector);
    adapter = inject(DataAdapter, { optional: true });

    item = input<TItem>();
    dialogOptions = input<any>({ title: "Create" });
    btn = input<ActionDescriptor>({ name: "create", color: "primary", icon: "add", variant: "raised" });
    formViewModel = input<Class<TItem>>();
    updateAdapter = input<boolean>(false);

    async create() {
        // const v = value ? value() : item;
        const dialogOptions = this.dialogOptions();
        runInInjectionContext(this.injector, async () => {
            const mirror = reflectFormViewModelType(this.formViewModel());
            const value = this.item() ?? new mirror.viewModelType();
            const { dialogRef } = await openFormDialog<Class, TItem>(this.formViewModel(), value, { dialogOptions, defaultAction: true, injector: this.injector });
            const result = await firstValueFrom(dialogRef.afterClosed());
            if (result && this.updateAdapter()) {
                const { submitResult } = result;
                if (this.adapter && submitResult) {
                    await this.adapter.create(submitResult);
                }
            }
        });
    }
}

export function createButton<T = unknown>(
    formViewModel: Class,
    value = new formViewModel(),
    options?: {
        descriptor?: Partial<ActionDescriptor>;
        dialogOptions?: Partial<DialogConfig>;
        updateAdapter?: boolean;
    },
): DynamicComponent<CreateButton> {
    options ??= {};
    const defaultCreateDescriptor: Partial<ActionDescriptor> = {
        text: "Create",
        icon: "add",
        variant: "raised",
        color: "primary",
        type: "button",
    };
    const btn = { ...defaultCreateDescriptor, ...options.descriptor };
    const dialogOptions = { title: "Create", ...options?.dialogOptions };

    return {
        component: CreateButton<any, T>,
        inputs: { formViewModel, dialogOptions, btn, updateAdapter: options.updateAdapter, item: value },
    } as DynamicComponent<CreateButton>;
}
