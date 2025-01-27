import { DataAdapterDescriptor } from "@upupa/data";
import { DataListComponent, withTableHeader } from "@upupa/table";
import { DynamicComponent, provideRoute, RouteFeature } from "@upupa/common";
import { Route } from "@angular/router";
import { Type } from "@angular/core";
import { CreateUserFromViewModel, EditUserFromViewModel, UserListViewModel } from "./user.forms";
import { createButton } from "@upupa/cp";

export type UsersTableConfig = {
    tableViewModel?: Type<UserListViewModel>;
    createUserViewModel?: Type<CreateUserFromViewModel>;
    dataAdapter?: DataAdapterDescriptor;
    tableHeaderComponent?: DynamicComponent;
};

export function provideUsersTable(route: Omit<Route, "component"> & UsersTableConfig, ...features: RouteFeature[]): Route {
    return provideRoute(route, withUsersTable(route), ...features);
}
export function withUsersTable(config?: Partial<UsersTableConfig>): RouteFeature {
    const tableComponent = {
        component: DataListComponent,
        inputs: {
            viewModel: config?.tableViewModel ?? UserListViewModel,
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
            tableHeaderComponent: config?.tableHeaderComponent ?? withTableHeader(true, createButton(config?.createUserViewModel ?? CreateUserFromViewModel)),
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
