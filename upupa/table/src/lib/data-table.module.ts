import { provideRoute, DynamicComponent, RouteFeature } from "@upupa/common";
import { makeEnvironmentProviders, Provider, Type } from "@angular/core";

import { Route } from "@angular/router";

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

// const imports = [
//     MatCardModule,
//     MatTableModule,
//     MatChipsModule,
//     MatDialogModule,
//     MatTooltipModule,
//     MatProgressBarModule,
//     MatMenuModule,
//     MatFormFieldModule,
//     MatInputModule,
//     MatCheckboxModule,
//     MatSortModule,
//     MatPaginatorModule,
//     MatIconModule,
//     MatButtonModule,
//     MatToolbarModule,
//     DataTableComponent,
//     DefaultTableCellTemplate,
//     ColumnsSelectComponent,
//     DynamicPipe,
//     NonePureDynamicPipe,
//     JsonPointerPipe,
//     TableColumnSelectorPipe,
//     DataComponentBase,
//     DataComponentBase,
//     MatBtnComponent,
//     ActionDescriptorComponent,
//     PortalComponent,
//     TableHeaderComponent,
//     CommonModule,
//     UtilsModule,
//     RouterModule,
//     FormsModule,
//     UtilsModule,
//     DragDropModule,
// ];
// const declarations = [];

// @NgModule({
//     declarations: declarations,
//     imports: [...imports, ...pipes],
//     exports: [...imports, DragDropModule],
//     providers: [...pipes, { provide: DATA_TABLE_OPTIONS, useValue: new DataTableOptions() }],
// })
// export class DataTableModule {
//     static forRoot(providers: Provider[]): ModuleWithProviders<DataTableModule> {
//         return {
//             ngModule: DataTableModule,
//             providers: [
//                 ...pipes,
//                 ...providers,
//                 {
//                     provide: DATA_TABLE_OPTIONS,
//                     useValue: { ...new DataTableOptions() },
//                 },
//             ],
//         };
//     }
// }
export function provideDataTable(options: DataTableOptions, providers: Provider[] = []) {
    return makeEnvironmentProviders([...pipes, ...providers, { provide: DATA_TABLE_OPTIONS, useValue: { ...new DataTableOptions(), ...options } }]);
}

export type TableConfig<T = unknown> = {
    viewModel: new (...args: any[]) => T;
    dataAdapter: DataAdapter<T> | DataAdapterDescriptor;
    tableHeaderComponent?: Type<any> | DynamicComponent;
    expandableComponent?: DynamicComponent;
};
export function withTableComponent<T = unknown>(config: TableConfig<T>): RouteFeature {
    return {
        name: "withTableComponent",
        modify: () => ({
            component: DataListComponent,
            data: {
                viewModel: config.viewModel,
                dataAdapter: config.dataAdapter,
                tableHeaderComponent: config.tableHeaderComponent,
                expandableComponent: config.expandableComponent,
                expandable: "single",
            },
        }),
    };
}

export function provideTableRoute<T = unknown>(config: Route & TableConfig<T>, ...features: RouteFeature[]): Route {
    return provideRoute(config, withTableComponent(config), ...features);
}

export function withTableHeader(showSearch: boolean, ...inlineEndSlot: (DynamicComponent | Class)[]): DynamicComponent {
    return {
        component: TableHeaderComponent,
        inputs: { showSearch, inlineEndSlot: inlineEndSlot.map((c) => ("component" in c ? c : { component: c })) },
    };
}
