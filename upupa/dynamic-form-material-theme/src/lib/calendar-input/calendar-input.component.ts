import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, forwardRef, input } from "@angular/core";
import { FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatFormFieldModule } from "@angular/material/form-field";

import { ErrorsDirective, InputBaseComponent } from "@upupa/common";

@Component({
    selector: "mat-form-calendar-input",
    templateUrl: "./calendar-input.component.html",
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MatCalendarInputComponent),
            multi: true,
        },
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, ReactiveFormsModule, MatFormFieldModule, MatDatepickerModule, ErrorsDirective, CommonModule, MatDatepickerModule],
    styles: [
        `
            :host {
                display: block;
            }
            mat-calendar {
                height: 100%;
                width: 100%;
                min-height: 300px;
            }
        `,
    ],
})
export class MatCalendarInputComponent extends InputBaseComponent<Date> {
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
