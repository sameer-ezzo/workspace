import { Component, forwardRef, ViewEncapsulation, input } from "@angular/core";
import { NG_VALUE_ACCESSOR } from "@angular/forms";
import { InputBaseComponent } from "@upupa/common";
import { InputDefaults } from "../defaults";
import { FloatLabelType, MatFormFieldAppearance } from "@angular/material/form-field";

@Component({
    standalone: true,
    selector: "form-input-field",
    templateUrl: "./input.component.html",
    styleUrls: ["./input.component.css"],
    encapsulation: ViewEncapsulation.None,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => InputComponent),
            multi: true,
        },
    ],
})
export class InputComponent extends InputBaseComponent {
    inlineError = true;

    appearance = input<MatFormFieldAppearance>(InputDefaults.appearance);
    floatLabel = input<FloatLabelType>(InputDefaults.floatLabel);
    placeholder = input("");

    type = input("text");
    label = input("");
    hint = input("");
    readonly = input(false);
    autocomplete = input("");
}
