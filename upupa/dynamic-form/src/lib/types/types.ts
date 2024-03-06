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
    type: 'fieldset' | 'field' | 'page-breaker',
    name: string,
    path?: string,
    text?: string,
    ui?: ElementUi,
    validations?: Validator[],
    validationTask?: ValidationTask,
}
export type Field = FieldItem | Fieldset; // | PageBreaker;

type ValidatorName = 'required' | 'requiredTrue' | 'latin' | 'email' | 'includes' | 'startsWith' | 'endsWith' | 'maxLength' | 'minLength' | 'length' | 'pattern' | 'regex' | 'max' | 'min' | 'greaterThan' | 'lessThan' | 'before' | 'after' | 'timeSpanMax' | 'timeSpanMin'
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
export type FieldItem = FieldBase & { type: 'field' | 'page-breaker' } & (
    { input: string, validations?: Validator[] } |
    { input: 'hidden', validations?: Validator[] } |
    { input: 'recaptcha', validations?: Validator[] } |

    { input: 'text', validations?: StringValidator[] } |
    { input: 'textarea', validations?: StringValidator[] } |
    { input: 'paragraph', validations?: StringValidator[] } |
    { input: 'color', validations?: StringValidator[] } |
    { input: 'autocomplete-text', validations?: StringValidator[] } |

    { input: 'number', validations?: NumberValidator[] } |
    { input: 'number-range', validations?: NumberValidator[] } |
    { input: 'date', validations?: DateTimeValidator[] } |

    { input: 'phone', validations?: (StringValidator | RegexValidator | PatternValidator)[] } |
    { input: 'password', validations?: StringValidator[] } |

    { input: 'slider', validations?: NumberValidator[] } |
    { input: 'reviews', validations?: NumberValidator[] } |
    { input: 'email', validations?: EmailValidator[] } |
    { input: 'date', validations?: DateTimeValidator[] } |
    { input: 'date-range', validations?: DateTimeValidator[] } |
    { input: 'select', validations?: (RequiredValidator | LengthValidator | MaxLengthValidator | MinLengthValidator)[] } |
    { input: 'array', validations?: (RequiredValidator | LengthValidator | MaxLengthValidator | MinLengthValidator)[] } |
    { input: 'radios', validations?: (RequiredValidator | LengthValidator | MaxLengthValidator | MinLengthValidator)[] } |
    { input: 'checks', validations?: (RequiredValidator | LengthValidator | MaxLengthValidator | MinLengthValidator)[] } |
    { input: 'chips', validations?: (RequiredValidator | LengthValidator | MaxLengthValidator | MinLengthValidator)[] } |
    { input: 'file', validations?: RequiredValidator[] } |
    { input: 'local-file', validations?: RequiredValidator[] } |
    { input: 'tree', validations?: (RequiredValidator | LengthValidator | MaxLengthValidator | MinLengthValidator)[] } |
    { input: 'switch', validations?: RequiredValidator[] } |
    { input: 'address', validations?: RequiredValidator[] }
)



export type Fieldset = FieldBase & {
    type: 'fieldset',
    items: FormScheme
};

// export type PageBreaker = FieldBase & {
//   type: 'page-breaker'
// };

export type FormScheme = { [name: string]: Field }

export type ComponentInputs = { [name: string]: any };
export type DynamicComponentMapping = {
    component: Type<any>;
    field?: Partial<FieldItem>;
};
export class DynamicComponentMapper {
    [type: string]: DynamicComponentMapping;
}

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