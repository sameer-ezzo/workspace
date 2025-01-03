import { Component, forwardRef, model, input, inject, InputSignal } from "@angular/core";
import { NG_VALUE_ACCESSOR, AbstractControl, NG_VALIDATORS, FormControl, Validator, FormBuilder } from "@angular/forms";

import { PasswordStrength, generatePassword, verifyPassword } from "@upupa/auth";
import { InputComponent } from "../input/input.component";

@Component({
    standalone: true,
    selector: "form-password-field",
    templateUrl: "./password.component.html",
    styleUrls: ["./password.component.scss"],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => PasswordInputComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => PasswordInputComponent),
            multi: true,
        },
    ],
})
export class PasswordInputComponent extends InputComponent implements Validator {
    confirmPwd = null;
    confirmControl = new FormControl("");

    showConfirmPasswordInput = input(true);
    showPassword = model(false);
    canGenerateRandomPassword = input(false);
    passwordStrength = input<PasswordStrength, PasswordStrength>(new PasswordStrength(), { transform: (v) => v ?? new PasswordStrength() });
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
