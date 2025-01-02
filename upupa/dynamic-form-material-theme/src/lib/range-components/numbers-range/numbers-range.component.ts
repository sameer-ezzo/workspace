import { CommonModule } from "@angular/common";
import { Component, forwardRef } from "@angular/core";
import { FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { NumbersRangeComponent } from "@upupa/dynamic-form-native-theme";

// https://angular-slider.github.io/ngx-slider/demos
@Component({
    standalone: true,
    selector: "mat-form-numbers-range-input",
    templateUrl: "./numbers-range.component.html",
    styleUrls: ["./numbers-range.component.scss"],
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MatNumbersRangeComponent), multi: true }],
    imports: [CommonModule, MatFormFieldModule, MatInputModule, FormsModule, ReactiveFormsModule],
})
export class MatNumbersRangeComponent<T = number> extends NumbersRangeComponent<T> {}
