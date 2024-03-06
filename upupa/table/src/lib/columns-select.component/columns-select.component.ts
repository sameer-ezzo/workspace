import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ColumnDescriptor } from '../data-table.component';


@Component({
    selector: 'columns-select',
    templateUrl: './columns-select.component.html'
})
export class ColumnsSelectComponent {
    columns: { name: string, descriptor: ColumnDescriptor }[] = [];
    constructor(@Inject(MAT_DIALOG_DATA) public data: { table: string, columns: Record<string, any> }) { }

    ngOnInit() {
        const columns = this.data.columns
        for (const k in columns) {
            if (Number.isFinite(columns[k])) columns[k] = {}
            if (columns[k].visible === null) columns[k].visible = true;
            this.columns.push({ name: k, descriptor: columns[k] });
        }
    }

    saveSelection() {
        if (!this.data?.table || !localStorage) return

        const selectedColumns = this.columns.filter(x => x.descriptor.visible).map(x => x.name);
        localStorage.setItem(`table#${this.data.table}`, selectedColumns.join(','));
    }
}