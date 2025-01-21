import { DataAdapterDescriptor } from "@upupa/data";
import { DataListComponent, withTableHeader } from "@upupa/table";
import { DynamicComponent, provideRoute, RouteFeature } from "@upupa/common";
import { Route } from "@angular/router";
import { Type } from "@angular/core";
import { UserListViewModel } from "./user.forms";

export type UsersTableConfig = {
    viewModel?: Type<UserListViewModel>;
    dataAdapter?: DataAdapterDescriptor;
    tableHeaderComponent?: DynamicComponent;
};

export function provideUsersTable(route: Omit<Route, "component"> & UsersTableConfig): Route {
    return provideRoute(route, withUsersTable(route));
}
export function withUsersTable(config?: Partial<UsersTableConfig>): RouteFeature {
    const tableComponent = {
        component: DataListComponent,
        inputs: {
            viewModel: config?.viewModel ?? UserListViewModel,
            dataAdapter: config?.dataAdapter ?? {
                type: "api",
                path: `user?select=_id,email,name,lastLogin,roles,disabled`,
                keyProperty: "_id",
                displayProperty: "email",
                options: {
                    page: { pageIndex: 0, pageSize: 100 },
                    sort: { active: "date", direction: "desc" },
                    terms: [
                        { field: "name", type: "like" },
                        { field: "email", type: "like" },
                    ],
                },
            },
            tableHeaderComponent: config?.tableHeaderComponent ?? withTableHeader(true),
        },
    } as DynamicComponent<DataListComponent>;

    return {
        name: "withUsersTable",
        modify: () => ({
            component: tableComponent.component,
            data: tableComponent.inputs,
        }),
    };
}
