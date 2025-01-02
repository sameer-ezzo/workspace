import { CommonModule } from "@angular/common";
import { Component, forwardRef } from "@angular/core";
import { FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { ErrorsDirective } from "@upupa/common";
import { PasswordInputComponent } from "@upupa/dynamic-form-native-theme";

@Component({
    standalone: true,
    selector: "mat-form-password-input",
    templateUrl: "./password.component.html",
    styleUrls: ["./password.component.scss"],
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MatPasswordInputComponent), multi: true }],
    imports: [FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, ErrorsDirective, CommonModule, MatIconModule, MatButtonModule],
})
export class MatPasswordInputComponent extends PasswordInputComponent {}
