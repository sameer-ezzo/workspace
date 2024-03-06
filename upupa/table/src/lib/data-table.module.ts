
import { TranslationModule } from '@upupa/language';
import { MatBtnModule, UtilsModule } from '@upupa/common';
import { ModuleWithProviders, NgModule, Pipe, PipeTransform, Provider } from '@angular/core';

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

import { DynamicPipe } from "./dynamic.pipe";
import { DataTableComponent } from './data-table.component';
import { KeyPipe } from './key.pipe';
import { ColumnsSelectComponent } from './columns-select.component/columns-select.component';

import { MatCardModule } from '@angular/material/card';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { DataComponentBase } from './datacomponent-base.component';



@Pipe({
    name: 'table-col-selector'
})
export class TableColumnSelectorPipe implements PipeTransform {
    transform(value: any, ...args: any[]): any {
        return args?.length > 0 ? value?.[args[0]] ?? '' : '';
    }
}



const pipes = [DatePipe, TableColumnSelectorPipe, PercentPipe, CurrencyPipe, DecimalPipe, AsyncPipe, JsonPipe, KeyValuePipe, LowerCasePipe, SlicePipe, TitleCasePipe, UpperCasePipe, I18nPluralPipe, I18nSelectPipe];

const material = [MatCardModule, MatTableModule, MatChipsModule, MatDialogModule, MatTooltipModule, MatProgressBarModule, MatMenuModule, MatFormFieldModule, MatInputModule, MatCheckboxModule, MatSortModule, MatPaginatorModule, MatIconModule, MatButtonModule, MatToolbarModule,];
const declarations = [DataTableComponent, ColumnsSelectComponent, DynamicPipe, KeyPipe, TableColumnSelectorPipe,DataComponentBase]
@NgModule({
    declarations: declarations,
    imports: [
        CommonModule,
        MatBtnModule,
        RouterModule,
        FormsModule,
        UtilsModule,
        DragDropModule,
        ...material,
        TranslationModule
    ],
    exports: [...declarations, DragDropModule],
    providers: [...pipes]
})
export class DataTableModule {

    static forRoot(providers: Provider[]): ModuleWithProviders<DataTableModule> {
        return {
            ngModule: DataTableModule,
            providers: [...pipes, ...providers]
        }
    }

}
