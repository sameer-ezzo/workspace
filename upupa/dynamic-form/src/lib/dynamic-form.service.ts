import { Inject, Injectable, Type, inject } from '@angular/core';
import { ValidatorFn } from '@angular/forms';

import { DynamicComponentMapper, DynamicComponentMapping, Field, Validator } from './types';
import { _mergeFields } from './dynamic-form.helper';
import { DEFAULT_THEME_NAME, DYNAMIC_COMPONENT_MAPPER, DYNAMIC_FORM_OPTIONS } from './di.token';

import { unreachable } from '@noah-ark/common';

@Injectable({
    providedIn: 'root',
})
export class DynamicFormService {
    public options = inject(DYNAMIC_FORM_OPTIONS);
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

    addControlType(type: string, component: Type<any>, theme: string, field?: Field) {
        this.componentMapper[theme][type] = { component, field };
    }
    getValidatorFactory(name: Validator['name']): (control) => ValidatorFn {
        return defaultValidator(name);
    }
}

function _error(v: Validator) {
    return { [v.name]: v };
}

export function defaultValidator(name: Validator['name']) {
    switch (name) {
        case 'required':
            return (v) => (control) => (v.arguments !== false && empty(control) ? _error(v) : null);
        case 'requiredTrue':
            return (v) => (control) => (control.value === undefined ? _error(v) : null);
        case 'pattern':
            return (v) => (control) => (empty(control) || new RegExp(<string>v.arguments).test(control.value) ? null : _error(v));
        case 'max':
            return (v) => (control) => (control.value > v.arguments ? _error(v) : null);
        case 'min':
            return (v) => (control) => (control.value < v.arguments ? _error(v) : null);
        case 'greaterThan':
            return (v) => (control) => (control.value <= v.arguments ? _error(v) : null);
        case 'lessThan':
            return (v) => (control) => (control.value >= v.arguments ? _error(v) : null);
        case 'maxLength':
            return (v) => (control) => (control.value?.length > v.arguments ? _error(v) : null);
        case 'minLength':
            return (v) => (control) => (control.value?.length < v.arguments ? _error(v) : null);
        case 'latin':
            return (v) => (control) => (empty(control) || /^[a-zA-Z0-9^ ]+$/.test(control.value) ? null : _error(v));
        case 'email':
            return (v) => (control) => (empty(control) || /^[^@]+@[^.]+\.[a-zA-Z.-]{2,20}$/.test(control.value) ? null : _error(v));
        case 'endsWith':
            return (v) => (control) => (empty(control) || control.value.endsWith(v.arguments) ? null : _error(v));
        case 'startsWith':
            return (v) => (control) => (empty(control) || control.value.startsWith(v.arguments) ? null : _error(v));
        case 'includes':
            return (v) => (control) => (empty(control) || control.value.includes(v.arguments) ? null : _error(v));
        case 'length':
            return (v) => (control) => (control.value?.length === v.arguments ? null : _error(v));

        default:
            throw unreachable('default validator name', name as never);
    }
}

function empty(control) {
    return control === null || control.value === null || control.value === undefined || control.value === '' || control.value.length === 0;
}
