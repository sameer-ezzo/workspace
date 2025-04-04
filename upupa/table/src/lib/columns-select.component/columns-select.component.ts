import { Component, Input } from "@angular/core";
import { ColumnDescriptor } from "../types";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { FormsModule } from "@angular/forms";

@Component({
    selector: "columns-select",
    templateUrl: "./columns-select.component.html",
    imports: [MatCheckboxModule, FormsModule],
    styles: [
        `
            :host {
                display: block;
                padding: 1rem;
                box-sizing: border-box;

                table {
                    width: 100%;
                    th {
                        text-align: start;
                    }
                }
            }
        `,
    ]
})
export class ColumnsSelectComponent {
    columns: { name: string; descriptor: ColumnDescriptor }[] = [];
    private _data: { table: string; columns: Record<string, any> };
    @Input()
    public get data(): { table: string; columns: Record<string, any> } {
        return this._data;
    }
    public set data(value: { table: string; columns: Record<string, any> }) {
        this._data = value;
        if (!value) return;
        this.init(value);
    }

    init(data: { table: string; columns: Record<string, any> }) {
        const { columns } = data;
        for (const k in columns) {
            if (Number.isFinite(columns[k])) columns[k] = {};
            if (columns[k].visible === null) columns[k].visible = true;
            if (columns[k].sticky === null) columns[k].visible = false;
            this.columns.push({ name: k, descriptor: columns[k] });
        }
    }

    saveSelection() {
        if (!this.data?.table || !localStorage) return;

        const columnsInfo = this.columns.map((x) => ({ name: x.name, visible: x.descriptor.visible, sticky: x.descriptor.sticky }));
        localStorage.setItem(`table#${this.data.table}`, JSON.stringify(columnsInfo));
    }
}
