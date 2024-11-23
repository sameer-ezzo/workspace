import { Component, inject, input, model, Type } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { DynamicComponent, PortalComponent } from "@upupa/common";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { DataAdapter } from "@upupa/data";
import { debounceTime, distinctUntilChanged, Subject, switchMap } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
    selector: "table-header",
    styleUrl: "./table-header.component.scss",
    standalone: true,
    imports: [PortalComponent, MatIconModule, FormsModule, MatButtonModule],
    templateUrl: "./table-header.component.html",
})
export class TableHeaderComponent {
    adapter = inject(DataAdapter);
    showSearch = input(true);
    // table = inject(DataTableComponent);

    inlineEndSlot = input<DynamicComponent[], (Type<any> | DynamicComponent)[]>([], {
        transform: (components) => components.map((c) => (c instanceof Type ? { component: c } : c)),
    });

    q = model("");

    filter$ = new Subject<string>();
    constructor() {
        this.filter$.pipe(takeUntilDestroyed(), debounceTime(500), distinctUntilChanged()).subscribe((q) => this._doFilter(q));
    }
    onFilter() {
        this.filter$.next(this.q());
    }

    _doFilter(q) {
        this.adapter.dataSource.terms = [{ field: "title", type: "like" }];
        const f = { ...this.adapter.filter, ...(this.adapter.normalizeFilter(q) || {}) };
        this.adapter.filter = f;
    }
}
