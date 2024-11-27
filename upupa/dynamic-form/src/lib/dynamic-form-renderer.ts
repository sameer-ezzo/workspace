import { ValidatorFn, FormGroup, FormControl } from "@angular/forms";
import { _mergeFields } from "./dynamic-form.helper";
import { DynamicFormService } from "./dynamic-form.service";
import { Field, Validator, FormScheme, Fieldset } from "./types";
import { JsonPointer } from "@noah-ark/json-patch";
import { Injector } from "@angular/core";
import { name } from "platform";
import { FormGraph } from "./dynamic-form.component";
import { FieldRef } from "./field-ref";

export class DynamicFormBuilder {
    constructor(
        private readonly injector: Injector,
        private readonly formService: DynamicFormService,
    ) {}

    build(form: FormGroup, scheme: FormScheme, value: any, path = "/", rootForm: FormGroup = form): FormGraph {
        const graph = new Map<string, FieldRef>();
        // this.removeControls(form);
        for (const fieldName in scheme) {
            const field = scheme[fieldName];
            const fieldValue = JsonPointer.get(value ?? {}, fieldName);
            const _path = `${path}${fieldName}` as `/${string}`;

            if (field.input === "object") {
                const group = this.getFieldset(fieldName, field, _path, rootForm);

                form.addControl(fieldName, group, { emitEvent: false });
                graph.set(_path, group["fieldRef"]);
                const subControls = this.build(group, field.items, fieldValue, `${path}${fieldName}/`, rootForm);
                for (const [key, value] of subControls) {
                    graph.set(key, value);
                }
            } else if (field.input == "group") {
                const subControls = this.build(form, field.items, fieldValue, path, rootForm);
                graph.set(`group:${fieldName}`, new FieldRef(this.injector, fieldName, `group:${fieldName}`, field, rootForm));

                for (const [key, value] of subControls) {
                    graph.set(key, value);
                }
            } else if (field.input == "array") {
                // const array = new FormArray([], { validators: this.getValidators(field), asyncValidators: this.getAsyncValidators(field) });
                // array["name"] = field.name;
                // form.addControl(fieldName, array);
                // this.buildArray(array, field.items, fieldValue);
            } else {
                const control = this.getControl(fieldName, field, fieldValue, _path, rootForm);
                form.addControl(fieldName, control, { emitEvent: false });
                graph.set(_path, control["fieldRef"]);
            }
        }

        return graph;
    }

    private getFieldset(name: string, field: Fieldset, _path: `/${string}`, rootForm: FormGroup) {
        const group = new FormGroup(
            {},
            {
                validators: this.getValidators(field),
                asyncValidators: this.getAsyncValidators(field),
            },
        );
        const fieldRef = new FieldRef(this.injector, name, _path, field, rootForm, group);
        group["fieldRef"] = fieldRef;
        return group;
    }
    getControl(name: string, field: Field, value: any, path: `/${string}`, form: FormGroup) {
        const control = new FormControl(value, { validators: this.getValidators(field), asyncValidators: this.getAsyncValidators(field) });
        const fieldRef = new FieldRef(this.injector, name, path, field, form, control);
        control["fieldRef"] = fieldRef;
        return control;
    }
    // buildArray(array: FormArray, items: FormScheme, value: any) {
    //     if (!Array.isArray(value)) value = [];
    //     const fields = Object.values(items);
    //     for (let i = 0; i < fields.length; i++) {
    //         const field = fields[i];
    //         field.name = `${i}`;
    //         const fieldValue = value[i];
    //         if (field.input === "fieldset") {
    //             const group = new FormGroup(
    //                 {},
    //                 {
    //                     validators: this.getValidators(field),
    //                     asyncValidators: this.getAsyncValidators(field),
    //                 },
    //             );
    //             array.push(group);
    //             this.build(group, field.items, fieldValue);
    //         } else if (field.input == "array") {
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

    getValidator(validator: Validator, name: string, field: Field): ValidatorFn {
        const validatorFactory = this.formService.getValidatorFactory(validator.name);
        if (validatorFactory) return validatorFactory(validator);
        else throw `Field ${name} has an invalid validator: ${validator.name}`;
    }
    getValidators(field: Field) {
        const validations = field.validations ?? [];
        const isRequired = field.inputs?.["required"] ?? false;
        const requiredValidators = validations.filter((v) => v.name === "required" || v.name === "requiredTrue");

        if (isRequired && requiredValidators.length === 0) {
            validations.push({ name: "required" });
        }

        if (isRequired || requiredValidators.length > 0) {
            field.inputs ??= {};
            field.inputs["required"] = true;
        }

        return validations.map((v) => this.getValidator(v, name, field));
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
