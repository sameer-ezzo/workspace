import { UtilsModule, PortalComponent, provideRoute, DynamicComponent, RouteFeature } from "@upupa/common";
import { ModuleWithProviders, NgModule, Provider, Type } from "@angular/core";

import {
    CommonModule,
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
import { MatTableModule } from "@angular/material/table";
import { MatSortModule } from "@angular/material/sort";
import { MatPaginatorModule } from "@angular/material/paginator";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { FormsModule } from "@angular/forms";
import { Route, RouterModule } from "@angular/router";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatMenuModule } from "@angular/material/menu";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatDialogModule } from "@angular/material/dialog";
import { MatChipsModule } from "@angular/material/chips";

import { DynamicPipe, NonePureDynamicPipe } from "./dynamic.pipe";
import { DataTableComponent } from "./data-table.component";
import { JsonPointerPipe } from "./json-pointer.pipe";
import { ColumnsSelectComponent } from "./columns-select.component/columns-select.component";

import { MatCardModule } from "@angular/material/card";
import { DragDropModule } from "@angular/cdk/drag-drop";
import { DataComponentBase } from "./data-base.component";
import { DefaultTableCellTemplate } from "./cell-template-component";
import { DATA_TABLE_OPTIONS, DataTableOptions } from "./di.tokens";
import { ActionDescriptorComponent, MatBtnComponent } from "@upupa/mat-btn";
import { TableColumnSelectorPipe } from "./table-column-selector.pipe";

import { TableHeaderComponent } from "./table-header.component";
import { DataListComponent } from "./data-list/data-list.component";
import { DataAdapter, DataAdapterDescriptor } from "@upupa/data";
import { Class } from "@noah-ark/common";

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

const imports = [
    MatCardModule,
    MatTableModule,
    MatChipsModule,
    MatDialogModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatSortModule,
    MatPaginatorModule,
    MatIconModule,
    MatButtonModule,
    MatToolbarModule,
    DataTableComponent,
    DefaultTableCellTemplate,
    ColumnsSelectComponent,
    DynamicPipe,
    NonePureDynamicPipe,
    JsonPointerPipe,
    TableColumnSelectorPipe,
    DataComponentBase,
    DataComponentBase,
    MatBtnComponent,
    ActionDescriptorComponent,
    PortalComponent,
    TableHeaderComponent,
    CommonModule,
    UtilsModule,
    RouterModule,
    FormsModule,
    UtilsModule,
    DragDropModule,
];
const declarations = [];

@NgModule({
    declarations: declarations,
    imports: [...imports, ...pipes],
    exports: [...imports, DragDropModule],
    providers: [...pipes, { provide: DATA_TABLE_OPTIONS, useValue: new DataTableOptions() }],
})
export class DataTableModule {
    static forRoot(providers: Provider[]): ModuleWithProviders<DataTableModule> {
        return {
            ngModule: DataTableModule,
            providers: [
                ...pipes,
                ...providers,
                {
                    provide: DATA_TABLE_OPTIONS,
                    useValue: { ...new DataTableOptions() },
                },
            ],
        };
    }
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
