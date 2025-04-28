import { Component, ComponentRef, inject, Injector, input, model, Type } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { DynamicComponent, PortalComponent } from "@upupa/common";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { DataAdapter } from "@upupa/data";
import { debounceTime, distinctUntilChanged, Subject } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
    selector: "table-header",
    styleUrl: "./table-header.component.scss",
    imports: [PortalComponent, MatIconModule, FormsModule, MatButtonModule],
    templateUrl: "./table-header.component.html",
})
export class TableHeaderComponent {
    injector = inject(Injector);
    showSearch = input(true);
    // table = inject(DataTableComponent);

    components = input<(DynamicComponent | "spacer")[], (Type<any> | DynamicComponent | "spacer")[]>([], {
        transform: (components) =>
            components.map((c) => {
                if (c instanceof Type) return { component: c };
                else if (c === "spacer") return c;
                return c;
            }),
    });
    readonly componentRefs: ComponentRef<any>[] = [];

    /**
     * @deprecated Use `withHeader` instead.
     */
    inlineEndSlot = input<DynamicComponent[], (Type<any> | DynamicComponent)[]>([], {
        transform: (components) => components.map((c) => (c instanceof Type ? { component: c } : c)),
    });
    /**
     * @deprecated Use `withHeader` instead.
     */
    readonly inlineEndSlotComponentRefs: ComponentRef<any>[] = [];

    q = model("");

    filter$ = new Subject<string>();
    constructor() {
        this.filter$.pipe(takeUntilDestroyed(), debounceTime(500), distinctUntilChanged()).subscribe((q) => this._doFilter(q));
    }
    onFilter() {
        this.filter$.next(this.q());
    }

    _doFilter(q) {
        const adapter = this.injector.get(DataAdapter); // lazy injected because adaptor is provided to input signal not during construction
        const f = { ...adapter.filter(), search: q };
        adapter.load({ filter: f });
    }

    onAttached({ componentRef }, i: number) {
        this.inlineEndSlotComponentRefs[i] = componentRef;
    }
}
