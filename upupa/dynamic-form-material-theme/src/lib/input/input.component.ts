import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, forwardRef, ViewEncapsulation } from "@angular/core";
import { FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { ErrorsDirective } from "@upupa/common";
import { InputComponent } from "@upupa/dynamic-form-native-theme";

@Component({
    selector: "mat-form-input",
    templateUrl: "./input.component.html",
    styleUrls: ["./input.component.scss"],
    encapsulation: ViewEncapsulation.None,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MatInputComponent),
            multi: true,
        },
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, ReactiveFormsModule, ErrorsDirective, MatFormFieldModule, MatInputModule, ErrorsDirective, CommonModule]
})
export class MatInputComponent extends InputComponent {}

@Component({
    standalone: true,
    selector: "hidden-input",
    template: ` <input type="hidden" [value]="value() ?? ''" /> `,
    encapsulation: ViewEncapsulation.None,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => HiddenInputComponent),
            multi: true,
        },
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HiddenInputComponent extends InputComponent {}
