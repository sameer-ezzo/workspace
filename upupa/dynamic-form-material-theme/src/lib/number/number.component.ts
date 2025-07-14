
import { Component, forwardRef, input } from "@angular/core";
import { FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { FloatLabelType, MatFormFieldAppearance, MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { ErrorsDirective, InputBaseComponent } from "@upupa/common";
import { InputDefaults } from "../defaults";

@Component({
    selector: "mat-form-number-input",
    templateUrl: "./number.component.html",
    styleUrls: ["./number.component.scss"],
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MatNumberComponent), multi: true }],
    imports: [FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, ErrorsDirective],
})
export class MatNumberComponent extends InputBaseComponent<number> {
    inlineError = true;

    appearance = input<MatFormFieldAppearance>(InputDefaults.appearance);
    floatLabel = input<FloatLabelType>(InputDefaults.floatLabel);
    placeholder = input("");

    label = input("");
    hint = input("");
    readonly = input(false);

    min = input<number>(Number.MIN_VALUE);
    max = input<number>(Number.MAX_VALUE);

    // add input to tell the component about the number type (integer, float, double, etc)
    numberType = input<"integer" | "float" | "double">("float");

    private readonly fixNumberType = (value: any) => {
        if (value === null || value === undefined) return;
        if (this.numberType() === "integer") this.value.set(parseInt(value, 10));
        else this.value.set(parseFloat(value));
    };
}
