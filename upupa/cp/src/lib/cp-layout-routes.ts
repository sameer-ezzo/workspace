import { Type } from "@angular/core";
import { Route } from "@angular/router";
import { Observable } from "rxjs";
import { CpLayoutComponent } from "./cp-layout/cp-layout.component";
import { CP_SIDE_BAR_ITEMS } from "./di.token";
import { SideBarViewModel } from "./side-bar-group-item";
import { DynamicComponent, provideRoute, RouteFeature } from "@upupa/common";
import { DataAdapter, DataAdapterDescriptor } from "@upupa/data";
import { DataListWithInputsComponent } from "./data-list-with-inputs/data-list-with-inputs.component";
import { DataFormWithViewModelComponent } from "./data-form-with-view-model/data-form-with-view-model.component";
import { Class } from "@noah-ark/common";
import { FormViewModelMirror } from "@upupa/dynamic-form";
import { FormGroup } from "@angular/forms";

export type LayoutConfig = {
    layout?: Type<CpLayoutComponent>;
    logo?: string;
    sidebar: SideBarViewModel | { useFactory: (...args: any[]) => SideBarViewModel | Promise<SideBarViewModel> | Observable<SideBarViewModel>; deps?: any[] };
};

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

export function provideTableRoute<T = unknown>(config: Route & TableConfig<T>): Route {
    return provideRoute(config, withTableComponent(config));
}

export type DynamicFormConfig = { viewModel: Class | FormViewModelMirror; value?: any; form?: FormGroup };

export function withFormComponent<T>(config: DynamicFormConfig): RouteFeature {
    return {
        name: "withFormComponent",
        modify: () => ({
            component: DataFormWithViewModelComponent,
            data: {
                viewModel: config.viewModel,
                value: config.value,
                form: config.form,
            },
        }),
    };
}

export function provideFormRoute<T>(config: Route & DynamicFormConfig) {
    return provideRoute(config, withFormComponent(config));
}

export function composeForm<T>(config: { viewModel: Class | FormViewModelMirror; value?: T; form?: FormGroup }): DynamicComponent {
    return {
        component: DataFormWithViewModelComponent,
        inputs: {
            viewModel: config.viewModel,
            value: config.value,
            form: config.form,
        },
    };
}
