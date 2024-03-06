import { Component, Input, forwardRef, SimpleChanges } from '@angular/core';
import { NG_VALUE_ACCESSOR, AbstractControl, NG_VALIDATORS, FormControl } from '@angular/forms';

import { PasswordStrength, generatePassword, verifyPassword } from '@upupa/auth';
import { InputComponent } from '../input/input.component';

@Component({
    selector: 'form-password-field',
    templateUrl: './password.component.html',
    styleUrls: ['./password.component.scss'],
    providers: [
        { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PasswordInputComponent), multi: true },
        { provide: NG_VALIDATORS, useExisting: forwardRef(() => PasswordInputComponent), multi: true }
    ]
})
export class PasswordInputComponent extends InputComponent {
    override type = 'password';


    confirmPwd = null
    confirmControl: FormControl<string> = new FormControl<string>('')

    @Input() showConfirmPasswordInput = false
    @Input() showPassword = false
    @Input() canGenerateRandomPassword = false
    @Input() passwordStrength: PasswordStrength = new PasswordStrength();
    @Input() autocomplete: 'current-password' | 'new-password' = 'new-password';



    changeTouchedStatus(ctrl: AbstractControl) {
        if (this.showConfirmPasswordInput !== true) this.onTouch()
        else {
            if (this.confirmControl.touched && this.control.touched) this.onTouch()
            else ctrl.markAsUntouched()
        }
    }

    override ngOnChanges(changes: SimpleChanges): void {
        super.ngOnChanges(changes)
        if (changes['control']) {
            this._setControlValidators()
        }
    }
    ngOnInit() {
        if (!this.control) {
            this.control = new FormControl<string>('');
            this._setControlValidators()
        }
    }

    private _setControlValidators() {
        const v = this.control.validator || (() => null);
        this.control.setValidators(() => v(this.control) || this.validate(this.control));
        // this.control.updateValueAndValidity()
        this.control.markAsUntouched()
    }



    generateRandomPassword() {
        this.value = generatePassword(this.passwordStrength)
        this.confirmControl.setValue(this.value, { emitEvent: false, onlySelf: true, emitModelToViewChange: true })
    }
    override validate(control: AbstractControl) {

        if (!this.control || this.control.untouched) return null

        if (this.showConfirmPasswordInput === true && this.confirmControl.touched)
            if (control.value !== this.confirmControl.value) return { "not-matched": true }

        if (!this.passwordStrength) return null
        const passwordStrength = this.passwordStrength;
        const validations = [];
        const result = verifyPassword(control.value);
        for (const k in passwordStrength) {
            const message = 'passwrd-' + k;
            const current = result[k];
            const required = passwordStrength[k];
            if (Array.isArray(required)) {
                if (required[0] > current) validations.push({ message: message + '-min', current, required: required[0] })
                if (required[1] < current) validations.push({ message: message + '-max', current, required: required[1] })
            }
            else if (required > current) validations.push({ message, current, required })
        }

        if (validations.length === 0) return null;
        const errors = validations.map(v => ({ [v.message]: { required: v.required, current: v.current } }))
            .reduce((v1, v2) => ({ ...v1, ...v2 }), {})

        return errors;
    }
}