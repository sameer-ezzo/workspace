import { CommonModule } from "@angular/common";
import { Component, forwardRef, input } from "@angular/core";
import { FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatNumbersRangeComponent } from "../numbers-range/numbers-range.component";

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
    imports: [CommonModule, MatFormFieldModule, MatInputModule, FormsModule, ReactiveFormsModule, MatDatepickerModule],
})
export class MatDateRangeComponent extends MatNumbersRangeComponent {
    readonly = input(false);
}
