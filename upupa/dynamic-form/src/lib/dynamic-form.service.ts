import { Inject, Injectable, Type, inject } from '@angular/core';
import { ValidatorFn } from '@angular/forms';

import { FieldItem, Validator } from './types';
import { _mergeFields } from './dynamic-form.helper';
import { DEFAULT_THEME_NAME, DYNAMIC_COMPONENT_MAPPER, DYNAMIC_FORM_OPTIONS } from './di.token';
import { DynamicFormModuleOptions } from './dynamic-form.options';
import { DynamicComponentMapper, DynamicComponentMapping } from './types/types';

@Injectable({
    providedIn: 'root',
})
export class DynamicFormService {
    public options = inject(DYNAMIC_FORM_OPTIONS) as DynamicFormModuleOptions;
    public defaultThemeName = inject(DEFAULT_THEME_NAME) as string;
    private componentMapper = inject(DYNAMIC_COMPONENT_MAPPER) as DynamicComponentMapper;

    getControl(type: string = 'text', theme: string = this.defaultThemeName): DynamicComponentMapping {
        const result = this.componentMapper[theme][type];

        if (result) return result;
        if (this.options.enableLogs === true) {
            const text = `Dynamic Service: UnrecognizedType: ${type} in theme: ${theme}`;
            console.warn(text);
        }
        throw new Error(`Dynamic Service: UnrecognizedType: ${type} in theme: ${theme}`);
    }

    addControlType(type: string, component: Type<any>, theme: string, field?: FieldItem) {
        this.componentMapper[theme][type] = { component, field };
    }
    getValidatorFactory(name: string): (control) => ValidatorFn {
        return validatorsMap[name] as (control) => ValidatorFn;
    }
}

export const validatorsMap: { [name: string]: (validator: Validator) => ValidatorFn } = {
    required: (v) => (control) => {
        return empty(control) ? { [v.message || 'required']: true } : null;
    },
    requiredTrue: (v) => (control) => {
        if (!control) return null;
        return control.value === undefined ? { [v.message || 'required']: true } : null;
    },
    pattern: (v) => (control) => empty(control) || new RegExp(<string>v.arguments).test(control.value) ? null : { [v.message || 'invalid value']: true },
    max: (v) => (control) => control?.value > v.arguments ? { [v.message || 'max']: v.arguments } : null,
    min: (v) => (control) => control?.value < v.arguments ? { [v.message || 'min']: v.arguments } : null,
    greaterThan: (v) => (control) => control?.value <= v.arguments ? { [v.message || 'invalid (greater than)']: v.arguments } : null,
    lessThan: (v) => (control) => control?.value >= v.arguments ? { [v.message || 'invalid (less than)']: v.arguments } : null,
    maxLength: (v) => (control) => control?.value?.length > v.arguments ? { [v.message || 'value is longer than']: v.arguments } : null,
    minLength: (v) => (control) => control?.value?.length < v.arguments ? { [v.message || 'value is shorter than']: v.arguments } : null,
    latin: (v) => (control) => {
        const p = (v.arguments as RegExp) || /^[a-zA-Z0-9^ ]+$/;
        return empty(control) || p.test(control.value) ? null : { [v.message || 'should be latin characters only']: true };
    },
    email: (v) => (control) => {
        const res = empty(control) || /^[^@]+@[^.]+\.[a-zA-Z.-]{2,20}$/.test(control.value) ? null : { [v.message || 'invalid email']: true };

        return res;
    },
    timeSpanMax: (v) => (control) => Date.now() - (control.value as number) > (v.arguments as number) ? { [v.message || 'timeSpanMax']: true } : null,
    timeSpanMin: (v) => (control) => Date.now() - (control.value as number) < (v.arguments as number) ? { [v.message || 'timeSpanMin']: true } : null,
};

function empty(control) {
    return control === null || control.value === null || control.value === undefined || control.value === '' || control.value.length === 0;
}
