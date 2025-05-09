import { Component, input, computed, model, inject, Injector, effect } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { FormsModule } from "@angular/forms";
import { WidgetBlueprint } from "./model";
import { DialogRef } from "@upupa/dialog";
import { ChoicesBaseViewTemplateComponent, MatChoicesComponent } from "@upupa/dynamic-form-material-theme";
import { ClientDataSource, createDataAdapter } from "@upupa/data";
import { takeUntilDestroyed, toObservable } from "@angular/core/rxjs-interop";
import { combineLatest, map, startWith } from "rxjs";
import { DynamicComponent } from "@upupa/common";
@Component({
    selector: "icon-choices-template",
    styles: [
        `
            :host {
                display: grid !important;
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                grid-template-rows: auto;
                gap: 0.5rem;

                .choice-template {
                    border: 1px solid var(--mat-sys-outline-variant);
                    padding: 0.5rem;
                    :hover,
                    .active,
                    :host-context(.selected),
                    :focus-within {
                        background-color: var(--mat-sys-surface-container-high);
                    }
                }
            }
        `,
    ],

    imports: [MatIconModule, FormsModule],
    host: {
        "[class]": "_classList()",
        "[attr.name]": "name()",
    },
    template: ` @for (n of items(); track n.key) {
        <div class="choice-template widget-option" [class.selected]="n.selected === true" (click)="toggle(n.key)" (dblclick)="dialogRef.close(n.value)">
            <div style="display: flex; gap: 0.5rem; align-items: center" [style.border-bottom]="n.description ? '1px dashed #e5e7eb' : 'none'">
                @if (n.item.icon) {
                    <mat-icon>{{ n.item.icon }}</mat-icon>
                }
                <h3 class="title">{{ n.item.title }}</h3>
            </div>
            @if (n.item.description) {
                <p>{{ n.item.description }}</p>
            }
        </div>
    }`,
})
export class IconChoicesTemplateComponent extends ChoicesBaseViewTemplateComponent {
    icon = input<string>("");
    dialogRef = inject(DialogRef);
}
@Component({
    selector: "widget-selector",
    imports: [MatButtonModule, MatIconModule, FormsModule, MatChoicesComponent],
    styles: `
        .widget-selector {
            display: grid;
            gap: 0.5rem;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr) minmax(150px, 1fr));
        }

        .widget-option {
            border: 1px solid var(--mat-sys-outline-variant);
            padding: 0.5rem;
            background: var(--mat-sys-surface-container-high);
            border-radius: var(--mat-sys-corner-small);
            cursor: pointer;
        }

        input:focus {
            outline: none;
        }
        input {
            border: none;
            border-radius: var(--mat-sys-corner-small);
            background: none;
        }

        .title {
            margin: 0;
        }
        .selected {
            outline: #0078d4;
            outline-width: 2px;
            outline-style: solid;
            outline-offset: 2px;
        }
    `,
    template: ` <mat-form-choices-input #choices [adapter]="adapter" [choiceTemplate]="choicesTemplate"> </mat-form-choices-input> `,
})
export class WidgetBlueprintSelectorComponent {
    blueprints = input<WidgetBlueprint[]>();
    readonly dialogRef = inject(DialogRef);
    searchQuery = model<string>("");
    selectedBlueprint = model<WidgetBlueprint | null>(null);
    choicesTemplate: DynamicComponent = { component: IconChoicesTemplateComponent };
    private readonly _injector = inject(Injector);

    adapter = createDataAdapter(
        {
            type: "client",
            data: this.blueprints(),
            keyProperty: "id",
            displayProperty: "title",
            terms: [{ field: "title", type: "like" }],
        },
        this._injector,
    );
    private readonly bps$ = toObservable(this.blueprints).pipe(
        startWith([]),
        map((blueprints) => blueprints.map((bp) => ({ ...bp, selected: false }))),
    );

    private readonly search$ = toObservable(this.searchQuery).pipe(
        startWith(""),
        map((searchString) => searchString.toLowerCase()),
    );

    constructor() {
        combineLatest([this.bps$, this.search$])
            .pipe(takeUntilDestroyed())
            .subscribe(async ([blueprints, searchString]) => {
                const ds = this.adapter.dataSource as ClientDataSource;
                ds.all.set(blueprints);

                await this.adapter?.load({ filter: searchString ? { title: searchString } : {} });
                console.log("searchString", searchString);
                console.log("this.adapter", this.adapter.normalized(), this.blueprints());
            });
    }

    // displayedWidgets = computed(() => {
    //     const searchString = this.searchQuery().toLowerCase();
    //     if (!searchString) return this.blueprints();

    //     return this.blueprints().filter((blueprint) => {
    //         const terms = (blueprint.title + (blueprint.description ?? "")).toLowerCase();
    //         return terms.includes(searchString);
    //     });
    // });
}
