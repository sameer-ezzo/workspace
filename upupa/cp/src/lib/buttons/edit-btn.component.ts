import { Component, inject, Injector, input, runInInjectionContext } from "@angular/core";
import { Class } from "@noah-ark/common";
import { ActionDescriptor } from "@upupa/common";
import { DataAdapter } from "@upupa/data";
import { MatBtnComponent } from "@upupa/mat-btn";
import { ITableCellTemplate } from "@upupa/table";
import { editFormDialog } from "../helpers";

@Component({
    standalone: true,
    selector: "edit-btn",
    template: ` <mat-btn (onClick)="edit()" [buttonDescriptor]="btn()"></mat-btn>`,
    imports: [MatBtnComponent],
})
export class EditButton<TValue = unknown, TItem = unknown> implements ITableCellTemplate<TValue, TItem> {
    injector = inject(Injector);
    adapter = inject(DataAdapter, { optional: true });

    item = input<TItem>();
    dialogOptions = input<any>({ title: "Edit" });
    btn = input<ActionDescriptor>({ name: "edit", icon: "edit", variant: "icon" });
    formViewModel = input<Class>();

    async edit() {
        // const v = value ? value() : item;
        const dialogOptions = this.dialogOptions();
        runInInjectionContext(this.injector, async () => {
            const result = await editFormDialog(this.formViewModel(), this.item(), { dialogOptions, defaultAction: true });
            this.adapter?.put(this.item(), result.submitResult);
            this.adapter?.refresh(true);
        });
    }
}
