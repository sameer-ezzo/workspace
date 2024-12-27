import { CommonModule } from "@angular/common";
import { Component, forwardRef } from "@angular/core";
import { FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { ErrorsDirective } from "@upupa/common";
import { NumberComponent } from "@upupa/dynamic-form-native-theme";

@Component({
    standalone: true,
    selector: "mat-form-number-input",
    templateUrl: "./number.component.html",
    styleUrls: ["./number.component.scss"],
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MatNumberComponent), multi: true }],
    imports: [FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, ErrorsDirective, CommonModule],
})
export class MatNumberComponent extends NumberComponent {}
