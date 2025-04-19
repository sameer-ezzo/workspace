import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, forwardRef } from "@angular/core";
import { FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatFormFieldModule } from "@angular/material/form-field";

import { ErrorsDirective } from "@upupa/common";
import { DateInputComponent } from "@upupa/dynamic-form-native-theme";

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
    ]
})
export class MatCalendarInputComponent extends DateInputComponent {}
