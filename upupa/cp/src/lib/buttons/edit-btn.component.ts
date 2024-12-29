import { Component, inject, Injector, input, runInInjectionContext } from "@angular/core";
import { Class } from "@noah-ark/common";
import { ActionDescriptor, DynamicComponent } from "@upupa/common";
import { DataAdapter } from "@upupa/data";
import { MatBtnComponent } from "@upupa/mat-btn";
import { ITableCellTemplate } from "@upupa/table";
import { openFormDialog, waitForOutput } from "../helpers";
import { DialogConfig, DialogRef } from "@upupa/dialog";
import { firstValueFrom } from "rxjs";

@Component({
    standalone: true,
    selector: "edit-btn",
    template: ` <mat-btn (onClick)="edit()" [descriptor]="btn()"></mat-btn>`,
    imports: [MatBtnComponent],
})
export class EditButton<TValue = unknown, TItem = unknown> implements ITableCellTemplate<TValue, TItem> {
    injector = inject(Injector);
    adapter = inject(DataAdapter, { optional: true });

    item = input<TItem>();
    dialogOptions = input<any>({ title: "Edit" });
    btn = input<ActionDescriptor>({ name: "edit", icon: "edit", variant: "icon" });
    formViewModel = input<Class>();

    updateAdapter = input<boolean>(false);

    async edit() {
        // const v = value ? value() : item;
        const dialogOptions = this.dialogOptions();
        runInInjectionContext(this.injector, async () => {
            const { dialogRef } = await openFormDialog<Class, TItem>(this.formViewModel(), this.item(), { dialogOptions, defaultAction: true, injector: this.injector });
            const result = await firstValueFrom(dialogRef.afterClosed());
            if (!result) return;
            const { submitResult } = result;
            if (result && this.updateAdapter()) {
                await this.adapter.put(this.item(), submitResult);
                this.adapter.refresh();
            }
        });
    }
}

export function editButton<T = unknown>(
    formViewModel: Class,
    options?: {
        descriptor?: Partial<ActionDescriptor>;
        dialogOptions?: Partial<DialogConfig>;
        updateAdapter?: boolean;
    },
): DynamicComponent {
    options ??= {};
    const defaultEditDescriptor: Partial<ActionDescriptor> = {
        text: "Edit",
        icon: "edit",
        variant: "icon",
        color: "accent",
        type: "button",
    };
    const btn = { ...defaultEditDescriptor, ...options.descriptor };
    const dialogOptions = { title: "Edit", ...options?.dialogOptions };

    return {
        component: EditButton<any, T>,
        inputs: { formViewModel, dialogOptions, btn, updateAdapter: options?.updateAdapter },
    } as DynamicComponent<EditButton>;
}
