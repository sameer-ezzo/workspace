import { CommonModule } from "@angular/common";
import { Component, input } from "@angular/core";
import { MatRadioModule } from "@angular/material/radio";
import { ParagraphComponent } from "../paragraph/paragraph.component";

import { MatSelectComponent } from "../select/select.component";

import { ReactiveFormsModule } from "@angular/forms";
import { MatLabel } from "@angular/material/form-field";
import { MatIcon } from "@angular/material/icon";
import { MatError, MatHint } from "@angular/material/form-field";

@Component({
    selector: "radio-group-input",
    imports: [MatRadioModule, CommonModule, MatLabel, ParagraphComponent, MatIcon, MatError, MatHint, ReactiveFormsModule],
    host: {
        "[attr.name]": "name()",
    },
    template: `
        @if (label()) {
            <mat-label>{{ label() }}</mat-label>
        }
        <mat-radio-group [formControl]="control()" [attr.name]="name()">
            @for (item of items(); track item.key) {
                <mat-radio-button class="choice" [value]="item.value">
                    <paragraph [text]="item.display + ''" [renderer]="renderer()"></paragraph>
                </mat-radio-button>
            }
        </mat-radio-group>

        @if (hint()) {
            <mat-hint>{{ hint() }}</mat-hint>
        }
        <mat-error>
            <span *errors="control().errors; control: control(); let message">{{ message }}</span>
        </mat-error>
    `,
})
export class RadioGroupInputComponent extends MatSelectComponent {
    renderer = input<"markdown" | "html" | "none">("none");
}
