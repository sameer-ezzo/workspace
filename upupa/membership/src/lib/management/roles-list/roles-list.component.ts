import { inject, Type } from "@angular/core";
import { Route } from "@angular/router";
import { DynamicComponent, provideRoute, RouteFeature } from "@upupa/common";
import { createButton, deleteButton, editButton } from "@upupa/cp";
import { DataAdapter, DataAdapterDescriptor } from "@upupa/data";
import { DialogRef } from "@upupa/dialog";
import { DynamicFormInitializedEvent, fieldRef, formInput, OnSubmit } from "@upupa/dynamic-form";
import { column, DataListComponent, withHeader } from "@upupa/table";

export class RoleListViewModel implements OnSubmit {
    @formInput({ input: "text", label: "Id" })
    @column({ header: "Id" })
    _id: string;

    @formInput({ input: "text", label: "Name" })
    @column({ header: "Name" })
    name: string;

    @column({ header: " ", class: "actions", template: [editButton(RoleListViewModel), deleteButton()] })
    actions: any;

    onInit(e: DynamicFormInitializedEvent) {
        if (this._id) {
            const idRef = fieldRef("/_id");
            idRef.inputs.set({ ...idRef.inputs(), readonly: true }); // prevent editing of id when editing a record
        }
    }
    async onSubmit(): Promise<{ submitResult: RoleListViewModel }> {
        const adapter = inject(DataAdapter);
        const dialogRef = inject(DialogRef);
        await adapter.put(this, { _id: this._id, name: this.name });
        dialogRef.close({ submitResult: this });
        return { submitResult: this };
    }
}

export type RolesTableConfig = {
    viewModel?: Type<RoleListViewModel>;
    dataAdapter?: DataAdapterDescriptor;
    tableHeaderComponent?: DynamicComponent;
};

export function provideRolesTable(route: Omit<Route, "component"> & RolesTableConfig, ...features: RouteFeature[]): Route {
    return provideRoute(route, withRolesTable(route), ...features);
}
export function withRolesTable(config?: Partial<RolesTableConfig>): RouteFeature {
    const tableComponent = {
        component: DataListComponent,
        inputs: {
            viewModel: config?.viewModel ?? RoleListViewModel,
            dataAdapter: config?.dataAdapter ?? {
                type: "api",
                path: `role?select=_id,name`,
                keyProperty: "_id",
                displayProperty: "name",
                options: {
                    page: { pageIndex: 0, pageSize: 100 },
                    sort: { active: "date", direction: "desc" },
                    terms: [
                        { field: "_id", type: "like" },
                        { field: "name", type: "like" },
                    ],
                },
            },
            tableHeaderComponent: config?.tableHeaderComponent ?? withHeader(true, "spacer", createButton(RoleListViewModel)),
        },
    } as DynamicComponent<DataListComponent>;

    return {
        name: "withRolesTable",
        modify: () => ({
            component: tableComponent.component,
            data: tableComponent.inputs,
        }),
    };
}
