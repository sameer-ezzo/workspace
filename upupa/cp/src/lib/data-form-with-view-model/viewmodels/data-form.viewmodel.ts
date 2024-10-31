import { ValidationErrors } from '@angular/forms';

export interface OnSubmit {
    onSubmit(): Promise<void> | void;
}
export interface OnValidate {
    validate(): Promise<Promise<ValidationErrors>>;
}
export interface OnAfterSubmit {
    afterSubmit(): Promise<void> | void;
}
export interface DataFormViewModel {}
