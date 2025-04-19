import { Component, forwardRef, input } from "@angular/core";
import { FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { InputDefaults } from "../defaults";
import { InputBaseComponent } from "@upupa/common";

const _defaultRows = 3;
const _defaultMaxRows = 5;

@Component({
    selector: "form-text-area",
    templateUrl: "./text-area.component.html",
    styleUrls: ["./text-area.component.css"],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => TextAreaComponent),
            multi: true,
        },
    ],
    imports: [FormsModule, ReactiveFormsModule]
})
export class TextAreaComponent extends InputBaseComponent<string> {
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
