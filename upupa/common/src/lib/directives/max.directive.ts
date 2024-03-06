import { Directive, Input } from '@angular/core';
import { NG_VALIDATORS, Validator, AbstractControl, ValidationErrors } from '@angular/forms';


@Directive({
    selector: `[maximum]`,
    providers: [
        { provide: NG_VALIDATORS, useExisting: MaxValidator, multi: true }
    ]
})
export class MaxValidator implements Validator {
    @Input() maximum: number;
    control: AbstractControl;

    validate(control: AbstractControl): ValidationErrors | null {
        this.control = control;
        const value = this._toNumber(control.value);
        const target = this.maximum;
        return value === null || target >= value ? null : { maximum: { value, target } };
    }

    ngOnChanges() {

        this.maximum = this._toNumber(this.maximum);

        if (this.maximum != null && this.control) {
            const error = this.validate(this.control);
            const currentErrors = this.control.errors;

            if (error) this.control.setErrors(Object.assign(currentErrors || {}, error));
            else if (currentErrors) {
                delete currentErrors['maximum'];
                if (Object.keys(currentErrors).length) this.control.setErrors(Object.assign({}, currentErrors));
                else this.control.setErrors(null);
            }
        }
    }


    private _toNumber(n: any): number | null { return isNaN(+n) ? null : +n; }


}
