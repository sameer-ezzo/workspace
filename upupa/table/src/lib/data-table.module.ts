import { provideRoute, DynamicComponent, RouteFeature, ComponentOutputs } from "@upupa/common";
import { makeEnvironmentProviders, output, Provider, Type } from "@angular/core";

import { ResolveFn, Route } from "@angular/router";

import { TableHeaderComponent } from "./table-header.component";
import { DataListComponent } from "./data-list/data-list.component";
import { DataAdapter, DataAdapterDescriptor } from "@upupa/data";
import { Class } from "@noah-ark/common";
import {
    DatePipe,
    PercentPipe,
    CurrencyPipe,
    DecimalPipe,
    AsyncPipe,
    JsonPipe,
    KeyValuePipe,
    LowerCasePipe,
    SlicePipe,
    TitleCasePipe,
    UpperCasePipe,
    I18nPluralPipe,
    I18nSelectPipe,
} from "@angular/common";
import { TableColumnSelectorPipe } from "./table-column-selector.pipe";
import { DATA_TABLE_OPTIONS, DataTableOptions } from "./di.tokens";

const pipes = [
    DatePipe,
    TableColumnSelectorPipe,
    PercentPipe,
    CurrencyPipe,
    DecimalPipe,
    AsyncPipe,
    JsonPipe,
    KeyValuePipe,
    LowerCasePipe,
    SlicePipe,
    TitleCasePipe,
    UpperCasePipe,
    I18nPluralPipe,
    I18nSelectPipe,
];

export function provideDataTable(options?: (() => DataTableOptions) | DataTableOptions, providers: Provider[] = []) {
    const opts = typeof options === "function" ? options : () => ({ ...new DataTableOptions(), ...(options as DataTableOptions) });
    return makeEnvironmentProviders([...pipes, ...providers, { provide: DATA_TABLE_OPTIONS, useFactory: opts }]);
}

type _DataAdapter<T = unknown> = DataAdapter<T> | DataAdapterDescriptor<T>;

export type TableConfig<T = unknown> = {
    viewModel: new (...args: any[]) => T;
    dataAdapter?: _DataAdapter<T> | ResolveFn<_DataAdapter<T>>;
    tableHeaderComponent?: Type<any> | DynamicComponent;
    expandable?: "single" | "multi" | "none";
    expandableComponent?: DynamicComponent;
    outputs?: ComponentOutputs<DataListComponent>;
};
export function withTableComponent<T = unknown>(config: TableConfig<T>): RouteFeature {
    const _dataAdapter = typeof config.dataAdapter === "function" ? config.dataAdapter : () => config.dataAdapter;

    return {
        name: "withTableComponent",
        modify: () => ({
            loadComponent: () => import("./data-list/data-list.component").then((m) => m.DataListComponent),
            data: {
                viewModel: config.viewModel,
                tableHeaderComponent: config.tableHeaderComponent,
                expandableComponent: config.expandableComponent,
                expandable: "single",
                outputs: config.outputs,
            },
            resolve: {
                dataAdapter: _dataAdapter,
            },
        }),
    };
}

export function provideTableRoute<T = unknown>(config: Route & TableConfig<T>, ...features: RouteFeature[]): Route {
    return provideRoute(config, withTableComponent(config), ...features);
}

/**
 * @deprecated Use `withHeader` instead.
 */
export function withTableHeader(showSearch: boolean, ...inlineEndSlot: (DynamicComponent | Class)[]): DynamicComponent {
    return {
        component: TableHeaderComponent,
        inputs: { showSearch, inlineEndSlot: inlineEndSlot.map((c) => ("component" in c ? c : { component: c })) },
    };
}

export function withHeader(showSearch: boolean, ...components: (DynamicComponent | Class | "spacer")[]): DynamicComponent {
    return {
        component: TableHeaderComponent,
        inputs: { showSearch, components },
    };
}
