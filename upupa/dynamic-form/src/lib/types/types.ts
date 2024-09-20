import { Type } from "@angular/core";

export type ElementUi = {
    id?: string,
    class?: string,
    style?: string,
    inputs?: Record<string, any>,
    outputs?: Record<string, any>,
    hidden?: boolean
} & Record<string, any>




export type FieldBase = {
    /** @description The type of the field:
     *  - 'fieldset': represents a group of fields for nesting. inspired by HTML
     *  - 'field': represents single input
     *  - 'page-breaker': pseudo element
     **/
    // type: 'fieldset' | 'field' | 'page-breaker'

    /** @description The name of the field */
    name: string

    /** @description Optional. The path of the value model bond to */
    path?: string

    /** @description Optional. The text associated with the field */
    text?: string,

    /** @description Optional. UI configuration for the field */
    ui?: ElementUi,

    /** @description Optional. Array of validators for the field */
    validations?: Validator[],

    /** @description Optional. Validation task for the field */
    validationTask?: ValidationTask,
}


const INPUTS = ['hidden', 'recaptcha', 'text', 'textarea', 'paragraph', 'color', 'autocomplete', 'number', 'number', 'date', 'phone', 'password', 'slider', 'reviews', 'email', 'date', 'date', 'select', 'array', 'radios', 'checks', 'chips', 'file', 'local', 'tree', 'switch', 'address'] as const
export type INPUTS_TYPES = typeof INPUTS[number]

export type FieldItem = {
    type: 'field' | 'page-breaker'
    /**
    * @description input type inspired by html, it can be a string for any custom component or an INPUT_TYPE.
    * @example text, select, number, textarea
    */
    input: string | INPUTS_TYPES
    validations?: Validator[]
} & FieldBase



export type Fieldset = {
    type: 'fieldset',
    /**
     * @description the form scheme inside the fieldset in case type fieldset was chosen
     */
    items: FormScheme
} & FieldBase

// export type PageBreaker = FieldBase & {
//   type: 'page-breaker'
// };

export type Field =  Fieldset | FieldItem; // | PageBreaker;

export type FormScheme = { [name: string]: Field }

export type ComponentInputs = { [name: string]: any };
export type DynamicComponentMapping = {
    component: Type<any>;
    field?: Partial<FieldItem>;
};
export class DynamicComponentMapper {
    [type: string]: DynamicComponentMapping;
}



export type ValidatorName = 'required' | 'requiredTrue' | 'latin' | 'email' | 'includes' | 'startsWith' | 'endsWith' | 'maxLength' | 'minLength' | 'length' | 'pattern' | 'regex' | 'max' | 'min' | 'greaterThan' | 'lessThan' | 'before' | 'after' | 'timeSpanMax' | 'timeSpanMin'
export type RequiredValidator = { name: 'required' | 'requiredTrue', arguments?: boolean, message?: string }
export type EmailValidator = { name: 'email', arguments?: RegExp, message?: string }
export type LatinValidator = { name: 'latin', arguments?: RegExp, message?: string }
export type IncludesValidator = { name: 'includes', arguments: string, message?: string }
export type StartsWithValidator = { name: 'startsWith', arguments: string, message?: string }
export type EndsWithValidator = { name: 'endsWith', arguments: string, message?: string }

export type LengthValidator = { name: 'length', arguments: number, message?: string }
export type MaxLengthValidator = { name: 'maxLength', arguments: number, message?: string }
export type MinLengthValidator = { name: 'minLength', arguments: number, message?: string }

export type PatternValidator = { name: 'pattern', arguments: RegExp, message?: string }
export type RegexValidator = { name: 'regex', arguments: RegExp, message?: string }

export type MaxValidator = { name: 'max', arguments: number, message?: string }
export type MinValidator = { name: 'min', arguments: number, message?: string }
export type GreaterThanValidator = { name: 'greaterThan', arguments: number, message?: string }
export type LessThanValidator = { name: 'lessThan', arguments: number, message?: string }
export type BeforeValidator = { name: 'before', arguments: Date | number, message?: string }
export type AfterValidator = { name: 'after', arguments: Date | number, message?: string }
export type TimeSpanMaxValidator = { name: 'timeSpanMax', arguments: Date | number, message?: string }
export type TimeSpanMinValidator = { name: 'timeSpanMin', arguments: Date | number, message?: string }


export type Validator = RequiredValidator | EmailValidator | LatinValidator | IncludesValidator | StartsWithValidator | EndsWithValidator |
    LengthValidator | MaxLengthValidator | MinLengthValidator | PatternValidator | RegexValidator | MaxValidator | MinValidator | GreaterThanValidator | LessThanValidator | BeforeValidator | AfterValidator | TimeSpanMaxValidator | TimeSpanMinValidator
type StringValidator = RequiredValidator | EmailValidator | LatinValidator | IncludesValidator | StartsWithValidator | EndsWithValidator
type NumberValidator = RequiredValidator | MaxValidator | MinValidator | GreaterThanValidator | LessThanValidator
type DateTimeValidator = BeforeValidator | AfterValidator | TimeSpanMaxValidator | TimeSpanMinValidator

export type ValidationTaskResult = null | boolean | { code: ValidationTask } | { [code: string]: any };
export class ValidationTask {
    task: (name: string, value: any) => Promise<ValidationTaskResult>;
    name: string;
    state?: 'check' | 'error' | 'vpn_key' | 'send' = 'send';
    error?: any;
    disabled? = true;
    confirm?: ValidationTask;
    token?: string;
}