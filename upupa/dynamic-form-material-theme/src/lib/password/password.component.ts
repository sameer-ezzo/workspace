import { CommonModule } from "@angular/common";
import { Component, forwardRef, input, model } from "@angular/core";
import { AbstractControl, FormControl, FormsModule, NG_VALIDATORS, NG_VALUE_ACCESSOR, ReactiveFormsModule, Validator } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldControl, MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { ErrorsDirective } from "@upupa/common";
import { MatInputComponent } from "../input/input.component";
import { PasswordStrength, generatePassword, verifyPassword } from "@noah-ark/common";

@Component({
    selector: "mat-form-password-input",
    templateUrl: "./password.component.html",
    styleUrls: ["./password.component.scss"],
    providers: [
        { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MatPasswordInputComponent), multi: true },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => MatPasswordInputComponent),
            multi: true,
        },
        { provide: MatFormFieldControl, useExisting: MatPasswordInputComponent },
    ],
    imports: [FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, ErrorsDirective, CommonModule, MatIconModule, MatButtonModule],
})
export class MatPasswordInputComponent extends MatInputComponent implements Validator {
    confirmPwd = null;
    confirmControl = new FormControl("");

    showConfirmPasswordInput = input(true);
    showPassword = model(false);
    canGenerateRandomPassword = input(false);
    passwordStrength = input<PasswordStrength>();
    override autocomplete = input<"current-password" | "new-password">("new-password");
    checkValidity() {
        if (!this.control().touched) return;
        this.validate(this.control());
        this.control().updateValueAndValidity();
    }
    changeTouchedStatus() {
        this.control().markAsTouched();
        this.confirmControl.markAsTouched();
    }
    generateRandomPassword() {
        const password = generatePassword(this.passwordStrength());
        this.value.set(password);
        this.confirmControl.setValue(password);
        this.propagateChange();
    }

    validate(control: AbstractControl) {
        const password = control.value;
        const confirm = this.confirmControl.value;
        if (this.showConfirmPasswordInput() === true) {
            if (password !== confirm) return { "Password and confirm password do not match": true };
        }

        const strength = this.passwordStrength();
        if (!strength) return null;
        const validations = [];
        const result = verifyPassword(control.value);
        for (const k in strength) {
            const current = result[k];
            const required = strength[k];
            if (Array.isArray(required)) {
                if (required[0] > current)
                    validations.push({
                        message: "Password should have at least " + required[0] + " " + k,
                        current,
                        required: required[0],
                    });
                if (required[1] < current)
                    validations.push({
                        message: "Password should have at most " + required[1] + " " + k,
                        current,
                        required: required[1],
                    });
            } else if (required > current) validations.push({ message: "Password should have at least " + required + " " + k, current, required });
        }

        if (validations.length === 0) return null;
        const errors = validations
            .map((v) => ({
                [v.message]: { required: v.required, current: v.current },
            }))
            .reduce((v1, v2) => ({ ...v1, ...v2 }), {});

        return errors;
    }
}
