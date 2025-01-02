import { Type } from "@angular/core";
import { Route, Routes } from "@angular/router";
import { Observable } from "rxjs";
import { CpLayoutComponent } from "./cp-layout/cp-layout.component";
import { CP_SIDE_BAR_ITEMS } from "./di.token";
import { SideBarGroup, SideBarViewModel } from "./side-bar-group-item";
import { DynamicComponent, provideRoute, RouteFeature } from "@upupa/common";
import { DataAdapter, DataAdapterDescriptor } from "@upupa/data";
import { DataListWithInputsComponent } from "./data-list-with-inputs/data-list-with-inputs.component";
import { DataFormComponent } from "./data-form-with-view-model/data-form-with-view-model.component";
import { Class } from "@noah-ark/common";
import { FormViewModelMirror } from "@upupa/dynamic-form";
import { FormGroup } from "@angular/forms";
import { TableHeaderComponent } from "@upupa/table";

export type LayoutConfig = {
    layout?: Type<CpLayoutComponent>;
    logo?: string;
    sidebar: SideBarViewModel | { useFactory: (...args: any[]) => SideBarViewModel | Promise<SideBarViewModel> | Observable<SideBarViewModel>; deps?: any[] };
};

export function provideLayoutRoute(config: Route & LayoutConfig, ...features: RouteFeature[]): Route {
    return provideRoute(config, withLayoutComponent(config), ...features);
}

export function withLayoutComponent(config: LayoutConfig): RouteFeature {
    return {
        name: "withLayoutComponent",
        modify: () => ({
            component: config.layout ?? CpLayoutComponent,
            data: {
                logo: config.logo,
            },
            providers: [
                Array.isArray(config.sidebar)
                    ? { provide: CP_SIDE_BAR_ITEMS, useValue: config.sidebar }
                    : { provide: CP_SIDE_BAR_ITEMS, useFactory: config.sidebar.useFactory, deps: config.sidebar.deps },
            ],
        }),
    };
}

export type TableConfig<T = unknown> = {
    viewModel: new (...args: any[]) => T;
    dataAdapter: DataAdapter<T> | DataAdapterDescriptor;
    tableHeaderComponent?: Type<any> | DynamicComponent;
};
export function withTableComponent<T = unknown>(config: TableConfig<T>): RouteFeature {
    return {
        name: "withTableComponent",
        modify: () => ({
            component: DataListWithInputsComponent,
            data: {
                viewModel: config.viewModel,
                dataAdapter: config.dataAdapter,
                tableHeaderComponent: config.tableHeaderComponent,
            },
        }),
    };
}

export function provideTableRoute<T = unknown>(config: Route & TableConfig<T>, ...features: RouteFeature[]): Route {
    return provideRoute(config, withTableComponent(config), ...features);
}

export function withTableHeader(showSearch: boolean, ...inlineEndSlot: DynamicComponent[]): DynamicComponent {
    return {
        component: TableHeaderComponent,
        inputs: { showSearch, inlineEndSlot: inlineEndSlot },
    };
}

export type DynamicFormConfig = { viewModel: Class | FormViewModelMirror; value?: any; form?: FormGroup };

export function withFormComponent<T>(config: DynamicFormConfig): RouteFeature {
    return {
        name: "withFormComponent",
        modify: () => ({
            component: DataFormComponent,
            data: {
                viewModel: config.viewModel,
                value: config.value,
                form: config.form,
            },
        }),
    };
}

export function provideFormRoute<T>(config: Route & DynamicFormConfig, ...features: RouteFeature[]): Route {
    return provideRoute(config, withFormComponent(config), ...features);
}

export function composeForm<T>(config: { viewModel: Class | FormViewModelMirror; value?: T; form?: FormGroup }): DynamicComponent {
    return {
        component: DataFormComponent,
        inputs: {
            viewModel: config.viewModel,
            value: config.value,
            form: config.form,
        },
    };
}

export type FlattenedRoutes = Record<string, Route>;
function flattenRoutes(routes: Routes, basePath = "/"): FlattenedRoutes {
    const result: FlattenedRoutes = {};
    for (const route of routes) {
        if (route.children?.length) {
            Object.assign(result, flattenRoutes(route.children, basePath + route.path + "/"));
        } else {
            result[basePath + route.path] = route;
        }
    }
    return result;
}

export function routesToActions(routes: Routes, basePath = "/"): SideBarViewModel {
    const flattenedRoutes = Object.entries(flattenRoutes(routes, basePath));
    const routesWithAction = flattenedRoutes.filter(([_, route]) => route.data?.["action"]);
    const routesWithGroup = routesWithAction.filter(([_, route]) => route.data["action"].group);
    const sideBar: SideBarViewModel = [];
    const groups = routesWithGroup.map(([_, route]) => {
        const g = route.data["action"].group;
        if (typeof g === "string") {
            return { name: g, text: g, items: [] } as SideBarGroup;
        }
        return { ...g, items: [] };
    });

    const groupMap = new Map<string, SideBarGroup>();
    for (const group of groups) {
        if (!groupMap.has(group.name)) groupMap.set(group.name, group);
    }

    for (const [path, route] of routesWithAction) {
        const groupName = typeof route.data["action"].group === "string" ? route.data["action"].group : route.data["action"].group?.name;

        if (groupName) {
            const group = groupMap.get(groupName);
            group.items.push({
                name: route.data["action"].action ?? path,
                link: path,
                icon: route.data["action"].icon,
                text: route.data["action"].text,
            });
            // check if group is already in sidebar
            if (!sideBar.includes(group)) {
                sideBar.push(group);
            }
        } else {
            sideBar.push({
                name: route.data["action"].action ?? path,
                link: path,
                icon: route.data["action"].icon,
                text: route.data["action"].text,
            });
        }
    }
    return sideBar;
}
