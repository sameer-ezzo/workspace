import { Component, input, computed, model, inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { FormsModule } from "@angular/forms";
import { WidgetBlueprint } from "./model";
import { DialogRef } from "@upupa/dialog";

@Component({
    selector: "widget-selector",
    standalone: true,
    imports: [MatButtonModule, MatIconModule, FormsModule],
    styles: `
        .widget-selector {
            display: grid;
            gap: 0.5rem;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr) minmax(150px, 1fr));
        }

        .widget-option {
            border: 1px solid #e5e7eb;
            padding: 0.5rem;
            background: #fff;
            border-radius: 3px;
            cursor: pointer;
        }

        input:focus {
            outline: none;
        }
        input {
            border: none;
            border-radius: 0;
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
    template: `
        <div style="display: flex;place-items: center;background: #fff; padding: 0.5rem; border: 1px solid #e5e7eb; width: fit-content;">
            <mat-icon>search</mat-icon>
            <input #input type="text" placeholder="Search widget" [(ngModel)]="searchQuery" />
        </div>
        <br />
        <div class="widget-selector">
            @let _blueprint = selectedBlueprint();
            @for (blueprint of displayedWidgets(); track blueprint.id) {
                <div class="widget-option" [class.selected]="_blueprint === blueprint" (click)="selectedBlueprint.set(blueprint)" (dblclick)="dialogRef.close(blueprint)">
                    <div style="display: flex; gap: 0.5rem; align-items: center" [style.border-bottom]="blueprint.description ? '1px dashed #e5e7eb' : 'none'">
                        @if (blueprint.icon) {
                            <mat-icon>{{ blueprint.icon }}</mat-icon>
                        }
                        <h3 class="title">{{ blueprint.title }}</h3>
                    </div>
                    @if (blueprint.description) {
                        <p>{{ blueprint.description }}</p>
                    }
                </div>
            }
        </div>
    `,
})
export class WidgetBlueprintSelectorComponent {
    blueprints = input<WidgetBlueprint[]>();
    readonly dialogRef = inject(DialogRef);
    searchQuery = model<string>("");
    selectedBlueprint = model<WidgetBlueprint | null>(null);

    displayedWidgets = computed(() => {
        const searchString = this.searchQuery().toLowerCase();
        if (!searchString) return this.blueprints();

        return this.blueprints().filter((blueprint) => {
            const terms = (blueprint.title + (blueprint.description ?? "")).toLowerCase();
            return terms.includes(searchString);
        });
    });
}
