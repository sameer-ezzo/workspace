import { Directive, Input } from '@angular/core';
import { NG_VALIDATORS, Validator, AbstractControl, ValidationErrors } from '@angular/forms';

@Directive({
    selector: '[equal][formControlName],[equal][formControl],[equal][ngModel]',
    standalone: true,
    providers: [
        { provide: NG_VALIDATORS, useExisting: EqualValidator, multi: true }
    ]
})
export class EqualValidator implements Validator {
    @Input() equal: string;
    control: AbstractControl;



    validate(control: AbstractControl): ValidationErrors | null {
        this.control = control;
        const value = control.value;
        const target = this.equal;
        return target === value ? null : { equal: { value, target } };
    }


    ngOnChanges() {
        if (this.control) {
            const error = this.validate(this.control);
            const currentErrors = this.control.errors;

            if (error) this.control.setErrors(Object.assign(currentErrors || {}, error));
            else if (currentErrors) {
                delete currentErrors['equal'];

                if (Object.keys(currentErrors).length) this.control.setErrors(Object.assign({}, currentErrors));
                else
                    this.control.setErrors(null);

            }
        }
    }


}
