import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, forwardRef, input } from "@angular/core";
import { FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { ErrorsDirective } from "@upupa/common";
import { DateInputComponent } from "@upupa/dynamic-form-native-theme";
import { InputDefaults } from "../defaults";

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
    imports: [FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, ErrorsDirective, CommonModule, MatDatepickerModule]
})
export class MatDateInputComponent extends DateInputComponent {
    appearance = input(InputDefaults.appearance);
    floatLabel = input(InputDefaults.floatLabel);
    touchUi = input(false);
    startAt = input<Date | number | null>(null);
    startView = input<"month" | "year" | "multi-year">("month");
}
