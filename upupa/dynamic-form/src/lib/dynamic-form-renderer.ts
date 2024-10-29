import { UntypedFormBuilder, ValidatorFn, FormGroup, FormControl, FormArray } from "@angular/forms";
import { _mergeFields } from "./dynamic-form.helper";
import { DynamicFormService } from "./dynamic-form.service";
import { Field, FieldItem, Validator, FormScheme } from "./types";
import { JsonPointer } from "@noah-ark/json-patch";

export class DynamicFormBuilder {
    constructor(private readonly formService: DynamicFormService) {}

    build(form: FormGroup, scheme: FormScheme, value: any): void {
        for (const fieldName in scheme) {
            const field = scheme[fieldName];
            const fieldValue = JsonPointer.get(value ?? {}, field.path ?? field.name ?? fieldName);

            if (field.type === "fieldset") {
                const group = new FormGroup(
                    {},
                    {
                        validators: this.getValidators(field),
                        asyncValidators: this.getAsyncValidators(field),
                    },
                );
                form.addControl(fieldName, group);
                this.build(group, field.items, fieldValue);
            } else if (field.type == "array") {
                // const array = new FormArray([], { validators: this.getValidators(field), asyncValidators: this.getAsyncValidators(field) });
                // form.addControl(fieldName, array);
                // this.buildArray(array, field.items, fieldValue);
            } else {
                this.addControl(form, field, fieldValue);
            }
        }
    }

    buildArray(array: FormArray, items: FormScheme, value: any) {
        if (!Array.isArray(value)) value = [];
        const fields = Object.values(items);
        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];
            field.name = `${i}`;
            const fieldValue = value[i];
            if (field.type === "fieldset") {
                const group = new FormGroup(
                    {},
                    {
                        validators: this.getValidators(field),
                        asyncValidators: this.getAsyncValidators(field),
                    },
                );
                array.push(group);
                this.build(group, field.items, fieldValue);
            } else if (field.type == "array") {
                const nestedArray = new FormArray([], {
                    validators: this.getValidators(field),
                    asyncValidators: this.getAsyncValidators(field),
                });
                array.push(nestedArray);
                this.buildArray(nestedArray, field.items, fieldValue);
            } else {
                const control = this.getControl(field, fieldValue);
                array.push(control);
            }
        }
    }

    addControl(form: FormGroup, field: FieldItem, value: any): void {
        const control = this.getControl(field, value);
        form.addControl(field.name, control);
    }

    getControl(field: FieldItem, value: any) {
        return new FormControl(value, { validators: this.getValidators(field), asyncValidators: this.getAsyncValidators(field) });
    }

    getValidator(validator: Validator, field: Field): ValidatorFn {
        const validatorFactory = this.formService.getValidatorFactory(validator.name);
        if (validatorFactory) return validatorFactory(validator);
        else throw `Field ${field.path ?? field.name} has an invalid validator: ${validator.name}`;
    }
    getValidators(field: Field) {
        const validations = field.validations || [];
        const isRequired = field.ui?.inputs?.["required"];
        const requiredValidators = validations.filter((v) => v.name === "required" || v.name === "requiredTrue");
        if (requiredValidators.length && !isRequired) {
            field.ui ??= {};
            field.ui.inputs ??= {};
            field.ui.inputs["required"] = true;
        }
        if (isRequired && requiredValidators.length === 0) validations.push({ name: "required", message: `${field.name} is required` });

        return validations.map((v) => this.getValidator(v, field));
    }

    getAsyncValidators(field: Field) {
        return [];
    }

    removeControls(form: FormGroup) {
        for (const key in form.controls) {
            form.removeControl(key);
        }
    }
}
