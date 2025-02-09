import { Component, inject, Injector, input, runInInjectionContext } from "@angular/core";
import { Class } from "@noah-ark/common";
import { ActionDescriptor, DynamicComponent } from "@upupa/common";
import { DataAdapter } from "@upupa/data";
import { MatBtnComponent } from "@upupa/mat-btn";
import { ITableCellTemplate } from "@upupa/table";
import { openFormDialog } from "../helpers";
import { DialogConfig } from "@upupa/dialog";
import { firstValueFrom } from "rxjs";
import { reflectFormViewModelType } from "@upupa/dynamic-form";

@Component({
    standalone: true,
    selector: "edit-btn",
    template: ` <mat-btn (action)="edit()" [buttonDescriptor]="btn()"></mat-btn>`,
    imports: [MatBtnComponent],
})
export class EditButton<TItem = unknown> implements ITableCellTemplate<unknown, TItem> {
    injector = inject(Injector);
    adapter = inject(DataAdapter, { optional: true });

    item = input<TItem>();
    data = input<(btn: EditButton<TItem>) => TItem>(() => this.item());
    dialogOptions = input<any>({ title: "Edit" });
    btn = input<ActionDescriptor>({ name: "edit", icon: "edit", variant: "icon" });
    formViewModel = input<Class>();

    updateAdapter = input<boolean>(false);

    async edit() {
        const dialogOptions = this.dialogOptions();
        runInInjectionContext(this.injector, async () => {
            const mirror = reflectFormViewModelType(this.formViewModel());
            const data = await this.data()?.(this);
            const value = data ?? this.item() ?? new mirror.viewModelType();
            const { dialogRef } = await openFormDialog<Class, TItem>(this.formViewModel(), value, { dialogOptions, defaultAction: true, injector: this.injector });
            const result = await firstValueFrom(dialogRef.afterClosed());

            if (result && this.updateAdapter()) {
                const { submitResult } = result;
                if (this.adapter && submitResult) {
                    await this.adapter.put(value, submitResult);
                }
            }
        });
    }
}

export function editButton<TItem = unknown>(
    formViewModel: Class,
    value: TItem | ((btn: EditButton<TItem>) => TItem) = (btn) => btn.item(),
    options?: {
        descriptor?: Partial<ActionDescriptor>;
        dialogOptions?: Partial<DialogConfig>;
        updateAdapter?: boolean;
    },
): DynamicComponent<EditButton<TItem>> {
    options ??= {};
    const defaultEditDescriptor: Partial<ActionDescriptor> = {
        text: "Edit",
        icon: "edit",
        variant: "icon",
        color: "accent",
        type: "button",
    };
    const btn = { ...defaultEditDescriptor, ...options.descriptor } as ActionDescriptor;
    const dialogOptions = { title: "Edit", ...options?.dialogOptions };

    const data = (typeof value === "function" ? value : (btn) => btn.item()) as (btn: EditButton<TItem>) => TItem;

    return {
        component: EditButton<TItem>,
        inputs: { formViewModel, dialogOptions, btn, data, updateAdapter: options?.updateAdapter },
    };
}
