import { ValidationErrors } from "@angular/forms";
import { ExtendedValueChangeEvent } from "@upupa/dynamic-form";

export interface OnSubmit<SubmitResult = unknown> {
    onSubmit(): Promise<SubmitResult> | SubmitResult;
}
export interface OnValidate {
    validate?: () => Promise<Promise<ValidationErrors>>;
}
export interface OnAfterSubmit {
    afterSubmit?: () => Promise<void> | void;
}
export interface OnValueChange {
    onValueChange(e: ExtendedValueChangeEvent);
}
