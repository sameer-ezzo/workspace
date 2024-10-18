import { Component, inject, input, model, Type } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { DynamicComponent, PortalComponent } from "@upupa/common";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";

@Component({
    selector: "table-header",
    styleUrl: "./table-header.component.scss",
    standalone: true,
    imports: [PortalComponent, MatIconModule, FormsModule, MatButtonModule],
    templateUrl: "./table-header.component.html",
})
export class TableHeaderComponent {
    label = input("");
    showSearch = input(true);

    // table = inject(DataTableComponent);

    inlineEndSlot = input<DynamicComponent[], (Type<any> | DynamicComponent)[]>([], {
        transform: (components) => components.map((c) => (c instanceof Type ? { component: c } : c)),
    });

    q = model("");

    // @Output() filterChange = new EventEmitter<FilterDescriptor>();
    // onFilter(q: string) {
    //     if (this.q() === q || (!this.q() && !q)) return;
    //     this.table.loading.set(true);
    //     this.q.set(q);
    //     const f = { ...this.table.adapter.filter, ...(this.table.adapter.normalizeFilter(q) || {}) };
    //     this.table.adapter.filter = f;
    //     // this.filterChange.emit(f);
    // }
}
