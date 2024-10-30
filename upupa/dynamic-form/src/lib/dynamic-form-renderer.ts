import { UntypedFormBuilder, ValidatorFn, FormGroup, FormControl, FormArray, UntypedFormGroup, AbstractControl } from '@angular/forms';
import { _mergeFields } from './dynamic-form.helper';
import { DynamicFormService } from './dynamic-form.service';
import { Field, FieldItem, Validator, FormScheme } from './types';
import { JsonPointer } from '@noah-ark/json-patch';

export class DynamicFormBuilder {
    controls: Map<Field, AbstractControl | UntypedFormGroup> = new Map();
    constructor(private readonly formService: DynamicFormService) {}

    build(form: FormGroup, scheme: FormScheme, value: any): void {
        this.removeControls(form);
        for (const fieldName in scheme) {
            const field = scheme[fieldName];
            const fieldValue = JsonPointer.get(value ?? {}, field.path ?? field.name ?? fieldName);

            if (field.type === 'fieldset') {
                const group = new FormGroup(
                    {},
                    {
                        validators: this.getValidators(field),
                        asyncValidators: this.getAsyncValidators(field),
                    }
                );
                group['name'] = field.name;
                form.addControl(fieldName, group);
                this.controls.set(field, group);
                this.build(group, field.items, fieldValue);
            } else if (field.type == 'array') {
                // const array = new FormArray([], { validators: this.getValidators(field), asyncValidators: this.getAsyncValidators(field) });
                // array["name"] = field.name;
                // form.addControl(fieldName, array);
                // this.buildArray(array, field.items, fieldValue);
            } else {
                this.addControl(form, field, fieldValue);
            }
        }
    }

    // buildArray(array: FormArray, items: FormScheme, value: any) {
    //     if (!Array.isArray(value)) value = [];
    //     const fields = Object.values(items);
    //     for (let i = 0; i < fields.length; i++) {
    //         const field = fields[i];
    //         field.name = `${i}`;
    //         const fieldValue = value[i];
    //         if (field.type === "fieldset") {
    //             const group = new FormGroup(
    //                 {},
    //                 {
    //                     validators: this.getValidators(field),
    //                     asyncValidators: this.getAsyncValidators(field),
    //                 },
    //             );
    //             array.push(group);
    //             this.build(group, field.items, fieldValue);
    //         } else if (field.type == "array") {
    //             const nestedArray = new FormArray([], {
    //                 validators: this.getValidators(field),
    //                 asyncValidators: this.getAsyncValidators(field),
    //             });
    //             array.push(nestedArray);
    //             this.buildArray(nestedArray, field.items, fieldValue);
    //         } else {
    //             const control = this.getControl(field, fieldValue);
    //             array.push(control);
    //         }
    //     }
    // }

    addControl(form: FormGroup, field: FieldItem, value: any): void {
        const control = this.getControl(field, value);
        form.addControl(field.name, control);
        this.controls.set(field, control);
    }

    getControl(field: FieldItem, value: any) {
        const control = new FormControl(value, { validators: this.getValidators(field), asyncValidators: this.getAsyncValidators(field) });
        control['name'] = field.name;
        return control;
    }

    getValidator(validator: Validator, field: Field): ValidatorFn {
        const validatorFactory = this.formService.getValidatorFactory(validator.name);
        if (validatorFactory) return validatorFactory(validator);
        else throw `Field ${field.path ?? field.name} has an invalid validator: ${validator.name}`;
    }
    getValidators(field: Field) {
        const validations = field.validations ?? [];
        const isRequired = field.ui?.inputs?.['required'] ?? false;
        const requiredValidators = validations.filter((v) => v.name === 'required' || v.name === 'requiredTrue');

        if (isRequired && requiredValidators.length === 0) {
            validations.push({ name: 'required' });
        }

        if (isRequired || requiredValidators.length > 0) {
            field.ui ??= {};
            field.ui.inputs ??= {};
            field.ui.inputs['required'] = true;
        }

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
