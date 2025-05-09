import { Component, inject, HostListener } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { FormsModule } from "@angular/forms";
import { DialogRef } from "@upupa/dialog";
import { ChoiceViewTemplateComponent } from "@upupa/dynamic-form-material-theme";
import { cloneDeep } from "@noah-ark/common";
@Component({
    selector: "icon-choices-template",
    styles: [
        `
            :host {
                display: block;
                padding: 1rem;
                border: 1px solid var(--mat-sys-outline-variant);
                border-radius: var(--mat-sys-corner-small);
                user-select: none;
                cursor: pointer;
                outline: none;
                background-color: var(--mat-sys-surface-container-low);
                transition: background-color 0.2s ease-in;
                & > .head {
                    display: flex;
                    gap: 0.5rem;
                    align-items: center;

                    .title {
                        margin: 0;
                    }
                }
                p:empty {
                    display: none;
                }
                p:not(:empty) {
                    display: block;
                    border-block-start: 1px dashed var(--mat-sys-outline-variant);
                }
                &:hover {
                    background-color: var(--mat-sys-surface-container-high);
                    outline: 2px solid var(--mat-sys-outline-variant);
                    outline-offset: -2px;
                }
                &.selected,
                &:focus-within,
                &:focus-visible {
                    background-color: var(--mat-sys-surface-container-highest);
                    outline: 2px solid var(--mat-sys-outline);
                    outline-offset: -2px;
                }
            }
        `,
    ],

    imports: [MatIconModule, FormsModule],
    host: {
        "[class]": "_classList()",
        "[attr.name]": "item().key",
        "[attr.role]": "'button'",
        "[attr.aria-checked]": "item().selected",
        "[attr.aria-label]": "item().display",
        "[attr.aria-labelledby]": "item().key",
        "[attr.aria-describedby]": "item().description || item().display",
    },
    template: `
        <div class="head">
            @if (item().item.icon) {
                <mat-icon>{{ item().item.icon }}</mat-icon>
            }
            <h3 class="title">{{ item().item.title }}</h3>
        </div>

        <p>{{ item().item.description }}</p>
    `,
})
export class IconChoicesTemplateComponent extends ChoiceViewTemplateComponent {
    dialogRef = inject(DialogRef);

    // host click listener
    @HostListener("click", ["$event"])
    _toggle(event: MouseEvent) {
        event.stopPropagation();
        event.preventDefault();
        this.toggle(event);
    }

    // host double click listener
    @HostListener("dblclick", ["$event"])
    selectAndClose(event: MouseEvent) {
        event.stopPropagation();
        event.preventDefault();
        const item = this.item();
        if (!item.selected) {
            this.toggle(event);
        }
        this.dialogRef.close(cloneDeep(item));
    }
}
// @Component({
//     selector: "widget-selector",
//     imports: [MatButtonModule, MatIconModule, FormsModule, MatChoicesComponent],
//     styles: `
//         .widget-selector {
//             display: grid;
//             gap: 0.5rem;
//             grid-template-columns: repeat(auto-fill, minmax(150px, 1fr) minmax(150px, 1fr));
//         }

//         .widget-option {
//             border: 1px solid var(--mat-sys-outline-variant);
//             padding: 0.5rem;
//             background: var(--mat-sys-surface-container-high);
//             border-radius: var(--mat-sys-corner-small);
//             cursor: pointer;
//         }

//         input:focus {
//             outline: none;
//         }
//         input {
//             border: none;
//             border-radius: var(--mat-sys-corner-small);
//             background: none;
//         }

//         .title {
//             margin: 0;
//         }
//         .selected {
//             outline: #0078d4;
//             outline-width: 2px;
//             outline-style: solid;
//             outline-offset: 2px;
//         }
//     `,
//     template: `
//         <mat-form-choices-input
//             #choices
//             [showSearch]="true"
//             [label]="'Add Widget'"
//             [(value)]="selectedBlueprint"
//             [multiple]="false"
//             [adapter]="adapter"
//             [choiceTemplate]="choicesTemplate"
//         >
//         </mat-form-choices-input>
//     `,
// })
// export class WidgetBlueprintSelectorComponent {
//     blueprints = input<WidgetBlueprint[]>();
//     readonly dialogRef = inject(DialogRef);
//     searchQuery = model<string>("");
//     selectedBlueprint = model<WidgetBlueprint | null>(null);
//     choicesTemplate: DynamicComponent = { component: IconChoicesTemplateComponent };
//     private readonly _injector = inject(Injector);

//     adapter = createDataAdapter(
//         {
//             type: "signal",
//             data: this.blueprints,
//             keyProperty: "id",
//             displayProperty: "title",
//             terms: [{ field: "title", type: "like" }],
//         },
//         this._injector,
//     );
//     private readonly _blueprints$ = toObservable(this.blueprints).pipe(startWith([]));

//     private readonly _search$ = toObservable(this.searchQuery).pipe(
//         startWith(""),
//         map((searchString) => searchString.toLowerCase()),
//     );

//     constructor() {
//         combineLatest([this._blueprints$, this._search$])
//             .pipe(takeUntilDestroyed())
//             .subscribe(([blueprints, searchString]) => {
//                 const ds = this.adapter.dataSource as ClientDataSource;
//                 ds.all = blueprints;

//                 this.adapter?.load({ filter: searchString ? { title: searchString } : {} });
//             });
//     }
// }
