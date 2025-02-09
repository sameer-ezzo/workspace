import { Component, inject, Injector, input, runInInjectionContext } from "@angular/core";
import { Class } from "@noah-ark/common";
import { ActionDescriptor, DynamicComponent } from "@upupa/common";
import { DataAdapter } from "@upupa/data";
import { MatBtnComponent } from "@upupa/mat-btn";
import { openFormDialog } from "./helpers";
import { DialogConfig } from "@upupa/dialog";
import { firstValueFrom } from "rxjs";
import { reflectFormViewModelType } from "@upupa/dynamic-form";

@Component({
    standalone: true,
    selector: "edit-btn",
    template: ` <mat-btn (action)="create()" [buttonDescriptor]="btn()"></mat-btn>`,
    imports: [MatBtnComponent],
})
export class CreateButton<TItem = unknown> {
    injector = inject(Injector);
    adapter = inject(DataAdapter, { optional: true });

    item = input<TItem>(); //from cell template
    data = input<(btn: CreateButton<TItem>) => TItem>(() => this.item());
    dialogOptions = input<any>({ title: "Create" });
    btn = input<ActionDescriptor>({ name: "create", color: "primary", icon: "add", variant: "raised" });
    formViewModel = input<Class<TItem>>();
    updateAdapter = input<boolean>(false);

    async create() {
        const dialogOptions = this.dialogOptions();
        runInInjectionContext(this.injector, async () => {
            const mirror = reflectFormViewModelType(this.formViewModel());
            const value = (await this.data()?.(this)) ?? this.item() ?? new mirror.viewModelType();
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

export function createButton<TItem = unknown>(
    formViewModel: Class,
    value: TItem | ((btn: CreateButton<TItem>) => TItem) = () => new formViewModel(),
    options?: {
        descriptor?: Partial<ActionDescriptor>;
        dialogOptions?: Partial<DialogConfig>;
        updateAdapter?: boolean;
    },
): DynamicComponent<CreateButton<TItem>> {
    options ??= {};
    const defaultCreateDescriptor: Partial<ActionDescriptor> = {
        text: "Create",
        icon: "add",
        variant: "raised",
        color: "primary",
        type: "button",
    };
    const btn = { ...defaultCreateDescriptor, ...options.descriptor } as ActionDescriptor;
    const dialogOptions = { title: "Create", ...options?.dialogOptions };

    const data = (typeof value === "function" ? value : () => value) as (btn: CreateButton<TItem>) => TItem;

    return {
        component: CreateButton<TItem>,
        inputs: { formViewModel, dialogOptions, btn, data, updateAdapter: options.updateAdapter },
    };
}
