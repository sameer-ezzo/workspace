import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ColumnDescriptor } from '../data-table.component';


@Component({
    selector: 'columns-select',
    templateUrl: './columns-select.component.html'
})
export class ColumnsSelectComponent {
    columns: { name: string, descriptor: ColumnDescriptor }[] = [];
    public data: { table: string, columns: Record<string, any> } = inject(MAT_DIALOG_DATA)

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

        const columnsInfo = this.columns.map(x => ({ name: x.name, visible: x.descriptor.visible, sticky: x.descriptor.sticky }));
        localStorage.setItem(`table#${this.data.table}`, JSON.stringify(columnsInfo));
    }
}