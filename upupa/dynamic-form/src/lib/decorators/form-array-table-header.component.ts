import { Component, ComponentRef, inject, Injector, input, model, Type } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { DynamicComponent, PortalComponent } from "@upupa/common";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { DataAdapter } from "@upupa/data";
import { debounceTime, distinctUntilChanged, Subject } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
    selector: "form-array-table-header",
    styles: [
        `
            :host {
                display: flex;
                padding: 0.5rem;
                gap: 0.25rem;
            }

            #search-box-wrapper {
                flex: 1;
                max-width: 320px;
                min-width: 250px;
                width: 100%;
                display: flex;
                border: var(--mat-table-row-item-outline-width, 1px) solid var(--mat-table-row-item-outline-color, rgba(0, 0, 0, 0.12));
                padding: 0 0.5rem;

                & > input {
                    color: var(--mat-app-text-color);
                    letter-spacing: (--mat-table-header-headline-tracking);
                    &::placeholder {
                        color: var(--mat-select-placeholder-text-color);
                    }
                }
            }
        `,
    ],
    standalone: true,
    imports: [PortalComponent, MatIconModule, FormsModule, MatButtonModule],
    template: `
        @if (showSearch()) {
            <div id="search-box-wrapper">
                <input
                    style="background: transparent; outline: none; border: none; display: flex; flex: 1"
                    placeholder="Search"
                    [(ngModel)]="q"
                    (input)="onFilter()"
                    (keydown.enter)="_doFilter(q())"
                />
                <button mat-icon-button (click)="_doFilter(q())">
                    <mat-icon>search</mat-icon>
                </button>
            </div>
        }

        <span style="flex: 1"></span>
        <div style="display: flex; align-items: center">
            @for (template of inlineEndSlot() ?? []; track $index) {
                <portal [component]="template['component']" [inputs]="template.inputs" [outputs]="template['outputs']" (attached)="onAttached($event, $index)"></portal>
            }
            <ng-content select></ng-content>
        </div>
    `,
})
export class ArrayFormTableHeaderComponent {
    injector = inject(Injector);
    showSearch = input(true);
    // table = inject(DataTableComponent);

    inlineEndSlot = input<DynamicComponent[], (Type<any> | DynamicComponent)[]>([], {
        transform: (components) => components.map((c) => (c instanceof Type ? { component: c } : c)),
    });
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
