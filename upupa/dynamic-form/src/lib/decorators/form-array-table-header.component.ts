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
                min-height: 40px; /* to prevent jumping when no actions are present */
                width: 100%; /* use all parent width */
                padding: 0 0.5rem;
                display: flex;
                flex-flow: row nowrap;
                align-items: center;
                height: 100%;
                width: fit-content;
                overflow: hidden;
                position: relative;
                justify-content: center;
                background-color: var(--mat-sys-surface-container-low);
                border: 1px solid var(--mat-sys-outline);
                color: var(--mat-sys-on-surface-bright);
                transition: all 0.2s ease-in-out;
                border-radius: 0.5rem;

                &:hover,
                &:focus-within {
                    background-color: var(--mat-sys-surface-container-lowest);
                    border-color: var(--mat-sys-outline-variant);
                    color: var(--mat-sys-on-surface);
                    box-shadow: var(--mat-sys-level1, 0 2px 5px rgba(0, 0, 0, 0.2));
                }
                input,
                select {
                    background-color: transparent;
                    transition: background-color 0.2s ease-in-out;
                    outline: none;
                    border: none;
                    height: 100%;
                }
                .filter-input {
                    flex: 1 1 auto;
                }
                input.filter-input {
                    min-width: 220px;
                    padding: 0.5rem;
                    ::placeholder {
                        color: var(--mat-sys-outline);
                    }
                }
            }
        `,
    ],
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
    `
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
