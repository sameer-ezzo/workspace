
import { Component, forwardRef, input } from "@angular/core";
import { FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { RangeInputBaseComponent } from "../rang-input-base.component";
import { InputDefaults } from "../../defaults";

export type DateFilterFn = (date: Date | null) => boolean;
@Component({
    selector: "mat-form-date-range-input",
    templateUrl: "./date-range.component.html",
    styleUrls: ["./date-range.component.css"],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MatDateRangeComponent),
            multi: true,
        },
    ],
    imports: [MatFormFieldModule, MatInputModule, FormsModule, ReactiveFormsModule, MatDatepickerModule],
})
export class MatDateRangeComponent<T = Date> extends RangeInputBaseComponent<T> {
    appearance = input(InputDefaults.appearance);
    floatLabel = input(InputDefaults.floatLabel);
    label = input("");
    placeholder = input("");
    hint = input("");
    readonly = input(false);

    filterFn = input<DateFilterFn, DateFilterFn>(() => true, {
        transform: (value) => {
            if (typeof value === "function") {
                return value;
            }
            return () => value === true;
        },
    });
}
