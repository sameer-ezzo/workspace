import { ValidationErrors } from "@angular/forms";
import { ExtendedValueChangeEvent } from "@upupa/dynamic-form";

export type SubmitResult<R = any> = { submitResult?: R; error?: any };

export interface OnSubmit {
    onSubmit<R>(): Promise<any> | any;
}
export interface OnValidate {
    validate?: () => Promise<Promise<ValidationErrors>>;
}
export interface OnValueChange {
    onValueChange(e: ExtendedValueChangeEvent);
}
