
import { TranslationModule } from '@upupa/language';
import { UtilsModule } from '@upupa/common';
import { ModuleWithProviders, NgModule, Provider } from '@angular/core';

import { CommonModule, DatePipe, PercentPipe, CurrencyPipe, DecimalPipe, AsyncPipe, JsonPipe, KeyValuePipe, LowerCasePipe, SlicePipe, TitleCasePipe, UpperCasePipe, I18nPluralPipe, I18nSelectPipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';

import { DynamicPipe, NonePureDynamicPipe } from "./dynamic.pipe";
import { DataTableComponent } from './data-table.component';
import { JsonPointerPipe } from './json-pointer.pipe';
import { ColumnsSelectComponent } from './columns-select.component/columns-select.component';

import { MatCardModule } from '@angular/material/card';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { DataComponentBase } from './data-base.component';
import { DefaultTableCellTemplate } from './cell-template-component';
import { DATA_TABLE_OPTIONS, DataTableOptions } from './di.tokens';
import { MatBtnComponent } from '@upupa/mat-btn';
import { TableColumnSelectorPipe } from './table-column-selector.pipe';
import { DataTableActionsWrapperComponent } from './data-table-actions-wrapper/data-table-actions-wrapper.component';
import { TableFormInput } from './table-form-input/table-form-input.component';
import { ValueDataComponentBase } from './value-data-base.component';
import { ActionDescriptorComponent } from "../../../mat-btn/src/lib/action-descriptor.component";





const pipes = [DatePipe, TableColumnSelectorPipe, PercentPipe, CurrencyPipe, DecimalPipe, AsyncPipe, JsonPipe, KeyValuePipe, LowerCasePipe, SlicePipe, TitleCasePipe, UpperCasePipe, I18nPluralPipe, I18nSelectPipe];

const material = [MatCardModule, MatTableModule, MatChipsModule, MatDialogModule, MatTooltipModule, MatProgressBarModule, MatMenuModule, MatFormFieldModule, MatInputModule, MatCheckboxModule, MatSortModule, MatPaginatorModule, MatIconModule, MatButtonModule, MatToolbarModule,];
const declarations = [DataTableComponent, DataTableActionsWrapperComponent, TableFormInput, DefaultTableCellTemplate, ColumnsSelectComponent, DynamicPipe, NonePureDynamicPipe, JsonPointerPipe, TableColumnSelectorPipe, DataComponentBase, ValueDataComponentBase]


@NgModule({
    declarations: declarations,
    imports: [
    CommonModule,
    UtilsModule,
    RouterModule,
    FormsModule,
    UtilsModule,
    DragDropModule,
    ...material,
    TranslationModule,
    MatBtnComponent,
    ActionDescriptorComponent
],
    exports: [...declarations, DragDropModule],
    providers: [...pipes, { provide: DATA_TABLE_OPTIONS, useValue: new DataTableOptions() }]
})
export class DataTableModule {

    static forRoot(providers: Provider[]): ModuleWithProviders<DataTableModule> {
        return {
            ngModule: DataTableModule,
            providers: [...pipes, ...providers,
            { provide: DATA_TABLE_OPTIONS, useValue: { ...new DataTableOptions() } }
            ]
        }
    }

}
