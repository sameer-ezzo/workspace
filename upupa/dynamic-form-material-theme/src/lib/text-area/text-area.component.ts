import { Component, forwardRef, input } from "@angular/core";
import { FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { ErrorsDirective, InputBaseComponent } from "@upupa/common";

import { InputDefaults } from "../defaults";

const _defaultRows = 3;
const _defaultMaxRows = 5;

@Component({
    selector: "mat-form-text-area-input",
    templateUrl: "./text-area.component.html",
    styleUrls: ["./text-area.component.css"],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MatTextAreaComponent),
            multi: true,
        },
    ],
    imports: [FormsModule, ReactiveFormsModule, ErrorsDirective, MatFormFieldModule, MatInputModule],
})
export class MatTextAreaComponent extends InputBaseComponent<string> {
    inlineError = true;

    appearance = input(InputDefaults.appearance);
    floatLabel = input(InputDefaults.floatLabel);
    placeholder = input("");

    label = input("");
    hint = input("");
    readonly = input(false);

    rows = input(_defaultRows, { transform: (v: number) => Math.max(1, v ?? _defaultRows) });
    maxRows = input(_defaultMaxRows, { transform: (v: number) => Math.max(2, v ?? _defaultMaxRows) });
}
