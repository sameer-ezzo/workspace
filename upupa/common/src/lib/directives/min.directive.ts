import { Directive, Input } from '@angular/core';
import { NG_VALIDATORS, Validator, AbstractControl, ValidationErrors } from '@angular/forms';


@Directive({
    selector: `[minimum]`,
    standalone: true,
    providers: [
        { provide: NG_VALIDATORS, useExisting: MinValidator, multi: true }
    ]
})
export class MinValidator implements Validator {
    @Input() minimum: number;
    control: AbstractControl;

    validate(control: AbstractControl): ValidationErrors | null {
        this.control = control;
        const value = this._toNumber(control.value);
        const target = this.minimum;
        return value === null || target <= value ? null : { minimum: { value, target } };
    }

    ngOnChanges() {

        this.minimum = this._toNumber(this.minimum);

        if (this.minimum != null && this.control) {
            const error = this.validate(this.control);
            const currentErrors = this.control.errors;

            if (error) this.control.setErrors(Object.assign(currentErrors || {}, error));
            else if (currentErrors) {
                delete currentErrors['minimum'];
                if (Object.keys(currentErrors).length) this.control.setErrors(Object.assign({}, currentErrors));
                else this.control.setErrors(null);
            }
        }
    }


    private _toNumber(n: any): number | null { return isNaN(+n) ? null : +n; }


}
