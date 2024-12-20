import { CommonModule } from "@angular/common";
import { Component, forwardRef } from "@angular/core";
import { FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { ErrorsDirective } from "@upupa/common";
import { DateRangeComponent } from "@upupa/dynamic-form-native-theme";

@Component({
    standalone: true,
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
    imports: [CommonModule, MatFormFieldModule, MatInputModule, ErrorsDirective, FormsModule, ReactiveFormsModule, MatDatepickerModule],
})
export class MatDateRangeComponent extends DateRangeComponent {}
