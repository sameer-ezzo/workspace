import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, forwardRef, input } from "@angular/core";
import { FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { ErrorsDirective, InputBaseComponent } from "@upupa/common";
import { InputDefaults } from "../defaults";
import { MatNativeDateModule } from "@angular/material/core";

@Component({
    selector: "mat-form-date-input",
    templateUrl: "./date-input.component.html",
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MatDateInputComponent),
            multi: true,
        },
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, ErrorsDirective, CommonModule, MatDatepickerModule, MatNativeDateModule],
})
export class MatDateInputComponent extends InputBaseComponent<Date> {
    appearance = input(InputDefaults.appearance);
    floatLabel = input(InputDefaults.floatLabel);
    touchUi = input(false);
    startAt = input<Date | number | null>(null);
    startView = input<"month" | "year" | "multi-year">("month");

    inlineError = true;

    placeholder = input("");

    label = input("");
    hint = input("");
    readonly = input(false);

    now = new Date();

    min = input<Date | number | null>(null);
    max = input<Date | number | null>(null);

    setDate(value: string) {
        const date = new Date(value);
        this.value.set(date);
        this.control()?.setValue(this.value());
    }
}
