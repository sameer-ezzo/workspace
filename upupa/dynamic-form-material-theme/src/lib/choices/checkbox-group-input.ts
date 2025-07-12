
import { Component, input } from "@angular/core";
import { ParagraphComponent } from "../paragraph/paragraph.component";
import { MatCheckbox } from "@angular/material/checkbox";
import { MatSelectComponent } from "../select/select.component";
import { ErrorsDirective } from "@upupa/common";
import { MatError, MatHint, MatLabel } from "@angular/material/form-field";
import { ReactiveFormsModule } from "@angular/forms";

@Component({
    selector: "check-boxes-template",
    imports: [ParagraphComponent, MatCheckbox, ErrorsDirective, MatLabel, ParagraphComponent, MatError, MatHint, ReactiveFormsModule],
    host: {
        "[attr.name]": "name()",
    },
    template: `
        @if (label()) {
            <mat-label>{{ label() }}</mat-label>
        }
        @for (item of items(); track item.key) {
            <mat-checkbox class="choice" (change)="toggle(item.key)" [checked]="item.selected">
                <paragraph [text]="item.display + ''" [renderer]="renderer()"></paragraph>
            </mat-checkbox>
        }

        @if (hint()) {
            <mat-hint>{{ hint() }}</mat-hint>
        }
        <mat-error>
            <span *errors="control().errors; control: control(); let message">{{ message }}</span>
        </mat-error>
    `,
})
export class CheckBoxGroupInputComponent extends MatSelectComponent {
    renderer = input<"markdown" | "html" | "none">("none");
}
