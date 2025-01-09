import { ValidationErrors } from "@angular/forms";
import { DynamicFormInitializedEvent, ExtendedValueChangeEvent } from "@upupa/dynamic-form";

export type SubmitResult<R = any> = { submitResult?: R; error?: any };

export interface OnSubmit {
    onSubmit<R>(): Promise<any> | any;
}
export interface OnValidate {
    validate?: () => Promise<ValidationErrors> | ValidationErrors;
}
export interface OnInit {
    onInit(e: DynamicFormInitializedEvent): Promise<void> | void;
}
export interface OnValueChange {
    onValueChange(e: ExtendedValueChangeEvent);
}
