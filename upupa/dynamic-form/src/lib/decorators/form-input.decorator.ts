// make a property decorator that creates a FormFieldItem from a property
// export * from './lib/decorators/form-field.decorator';
import 'reflect-metadata'
import { Field, FieldItem, Fieldset, FormScheme, Validator } from '../types';
import { toTitleCase } from '@upupa/common';
import { PasswordStrength } from '@upupa/auth';
import { DynamicFormInputs } from '../dynamic-form-inputs';

const _DYNAMIC_FORM_INPUTS: Record<string, DynamicFormInputs> = {};

export const resolveDynamicFormInputsFor = (path: string) => _DYNAMIC_FORM_INPUTS[path] ? Object.assign({}, _DYNAMIC_FORM_INPUTS[path]) : null;
export const resolveFormValueFactoryOf = (path: string) => resolveDynamicFormInputsFor(path)?.initialValueFactory;
export const resolveFormSchemeOf = (path: string) => resolveDynamicFormInputsFor(path)?.fields;

export interface IDynamicFormFieldOptions { }
export class TextFieldOptions { }
export class NumberFieldOptions { }
export class BooleanFieldOptions { }
export class AdapterFieldOptions {
    minAllowed?: number = 1
    maxAllowed?: number = 1
    adapter: SimpleDataAdapter = { dataSource: 'client', data: [] }
}

export type SimpleDataAdapter = SimpleServerDataAdapter | SimpleClientDataAdapter | SimpleUrlDataAdapter;

type SimpleDataAdapterBase = {
    dataSource: 'server' | 'client' | 'url'
    keyProperty?: string
    displayProperty?: string
    valueProperty?: string | string[]
    imageProperty?: string
    providerOptions?: any
    selectedColumns?: string[]
}

export type SimpleServerDataAdapter = SimpleDataAdapterBase & {
    dataSource: 'server';
    path: string
}

export type SimpleClientDataAdapter = SimpleDataAdapterBase & {
    dataSource: 'client';
    data: any[]
}

export type SimpleUrlDataAdapter = SimpleDataAdapterBase & {
    dataSource: 'url';
    url: string
}


type BaseFormFieldOptions = {
    required?: boolean;
    validations?: Validator[];
};
type VisibleFormFieldOptions = BaseFormFieldOptions & {
    label?: string,
    placeholder?: string,
    text?: string,
    hint?: string,
    appearance?: "fill" | "outline";
    disabled?: boolean;
    readonly?: boolean;
    hidden?: boolean;
};
type FileInputOptions = {
    includeAccess?: boolean,
    base?: string,
    path?: string,
    color?: 'primary' | 'accent' | 'warn',
    dateFormat?: string,
    minAllowedFiles?: number,
    maxAllowedFiles?: number,
    minSize?: number,
    maxSize?: number,
    accept?: string,
    view?: 'list' | 'grid',
    fileSelector?: 'browser' | 'system'
}
type ChoicesFieldOptions = VisibleFormFieldOptions & AdapterFieldOptions & {
    direction?: 'horizontal' | 'vertical', template?: 'normal' | 'thumbs', thumbSize?: number, renderer?: 'markdown' | 'html' | 'none'
}
export type FormFieldOptions = ({ from: any } & VisibleFormFieldOptions) |
    (
        { input: 'fieldset' } & VisibleFormFieldOptions & BaseFormFieldOptions
        | { input: 'hidden' } & BaseFormFieldOptions
        | { input: 'text' } & VisibleFormFieldOptions & TextFieldOptions
        | { input: 'textarea' } & VisibleFormFieldOptions & TextFieldOptions & {
            cdkAutosizeMinRows?: number,
            cdkAutosizeMaxRows?: number,
            cdkTextareaAutosize?: boolean
        }
        | { input: 'phone' } & VisibleFormFieldOptions & TextFieldOptions
        | { input: 'password' } & VisibleFormFieldOptions & TextFieldOptions & {
            showConfirmPasswordInput?: boolean,
            showPassword?: boolean,
            canGenerateRandomPassword?: boolean,
            passwordStrength?: PasswordStrength
            autocomplete?: 'current-password' | 'new-password'
        }
        | { input: 'number' } & VisibleFormFieldOptions & NumberFieldOptions
        | ({ input: 'switch' } & VisibleFormFieldOptions & BooleanFieldOptions & {
            template?: 'checkbox' | 'toggle',
            renderer?: 'markdown' | 'html' | 'none'
        })
        | ({ input: 'checks' } & ChoicesFieldOptions)
        | ({ input: 'radios' } & ChoicesFieldOptions)
        | ({ input: 'select' } & VisibleFormFieldOptions & AdapterFieldOptions)
        | { input: 'date' } & VisibleFormFieldOptions
        | { input: 'file' } & VisibleFormFieldOptions & FileInputOptions
        | { input: 'html' } & VisibleFormFieldOptions
        | { input: 'chips' } & VisibleFormFieldOptions & AdapterFieldOptions &
        {
            parentPath?: string,
            visible?: boolean,
            selectable?: boolean,
            removable?: boolean,
            separatorKeysCodes?: string[]
        } |
        { input: string } & Partial<VisibleFormFieldOptions & AdapterFieldOptions & { inputs: Record<string, any> }>
    );


function makeFieldItem(path: string, targe: any, propertyKey: string, options: FormFieldOptions): Field {

    const opts = options as VisibleFormFieldOptions & FormFieldOptions;
    const label = opts.label ?? opts.text ?? toTitleCase(propertyKey);

    const fieldBase = {
        name: propertyKey,
        validations: options.validations || [],
        path: path ? `${path}/${propertyKey}` : `/${propertyKey}`,

        ui: {
            inputs: {
                required: options.required,
                readonly: options['readonly'] === true,
                disabled: options['disabled'] === true,
                text: opts.text,
                hidden: opts.hidden,
                label,
                placeholder: opts.placeholder,
                appearance: opts.appearance,
                ...options,
                ...(options['inputs'] || {})
            }
        }
    } as Field;

    if (!('input' in options) || options.input === 'fieldset') {
        fieldBase.type = 'fieldset'
        const propType = Reflect.getMetadata("design:type", targe, propertyKey);
        (fieldBase as Fieldset).items = propType && typeof propType === 'function' ? resolveFormSchemeOf(propType.name) ?? {} : {}
        return fieldBase;
    }

    const field = {
        input: options.input,
        type: 'field',
        ...fieldBase
    } as FieldItem;



    if (field.input.length === 0) field.input = 'hidden';


    if (options['adapter']) {
        field.ui.inputs['_adapter'] = options['adapter']
        delete field.ui.inputs['adapter']
    }

    if (options.input === 'hidden') return field;



    if (options.input === 'switch') {
        const switchOptions = opts as any;
        field.ui.inputs['template'] = switchOptions.template ?? 'toggle';
        field.ui.inputs['renderer'] = switchOptions.renderer ?? 'none';
    }
    if (options.input === 'password') {
        const pwdOptions = opts as any;
        field.ui.inputs['showConfirmPasswordInput'] = pwdOptions.showConfirmPasswordInput ?? false;
        field.ui.inputs['showPassword'] = pwdOptions.showPassword ?? false;
        field.ui.inputs['canGenerateRandomPassword'] = pwdOptions.canGenerateRandomPassword ?? false;
        field.ui.inputs['passwordStrength'] = pwdOptions.passwordStrength ?? new PasswordStrength();
        field.ui.inputs['autocomplete'] = pwdOptions.autocomplete ?? 'new-password';
        return field;

    }

    if (options.input === 'file') {
        const fileOptions = opts as any;
        field.ui.inputs['minAllowedFiles'] = fileOptions.minAllowedFiles;
        field.ui.inputs['maxAllowedFiles'] = fileOptions.maxAllowedFiles;
        field.ui.inputs['path'] = fileOptions.path || `${field.path}`;
        field.ui.inputs['accept'] = fileOptions.accept || '*.*';
        field.ui.inputs['view'] = fileOptions.view || 'list';
        field.ui.inputs['fileSelector'] = fileOptions.fileSelector || 'system';
        field.ui.inputs['color'] = fileOptions.color || 'accent';
        field.ui.inputs['dateFormat'] = fileOptions.dateFormat || 'dd MMM yyyy';
        field.ui.inputs['includeAccess'] = fileOptions.includeAccess || false;
        field.ui.inputs['minSize'] = fileOptions.minSize || 0;
        field.ui.inputs['maxSize'] = fileOptions.maxSize || 1024 * 1024 * 10;
        return field;
    }
    if (options.input === 'html') {
        const htmlOptions = opts as any;
        field.ui.inputs['uploadPath'] = htmlOptions.path || '';
        return field;
    }
    return field;
}
function addInputToFormScheme(target: any, field: Field, options: FormFieldOptions) {
    const path = (Reflect.getMetadata('path', target) || null) as string;
    const key = path ?? target.constructor.name

    const dfInputs = resolveDynamicFormInputsFor(key) || { fields: {} as FormScheme } as DynamicFormInputs;
    if (!dfInputs.fields) dfInputs.fields = {} as FormScheme;

    const segments = field.path.split('/').filter(s => s);
    while (segments.length > 1) {
        const segment = segments.shift()!;
        if (!dfInputs.fields[segment]) {
            dfInputs.fields[segment] = {
                type: 'fieldset',
                name: segment,
                items: {}
            } as Fieldset;
        }
    }
    if (segments.length === 1) {
        dfInputs.fields[field.name] = field;
    }

    Reflect.defineMetadata('DYNAMIC_FORM_INPUTS', { fields: dfInputs.fields }, target);
    _DYNAMIC_FORM_INPUTS[key] = { fields: dfInputs.fields };
}
function toField(path: string, target: any, propertyKey: string, options: FormFieldOptions) {
    const field = makeFieldItem(path, target, propertyKey, options);
    return field;
}

export function formScheme(path?: string, options: DynamicFormInputs = {}) {
    return function (target: any) {
        const key = path ?? target.name;
        Reflect.defineMetadata('path', key, target);
        const formInputs = (Reflect.getMetadata('DYNAMIC_FORM_INPUTS', target) ?? _DYNAMIC_FORM_INPUTS[key] ?? _DYNAMIC_FORM_INPUTS[target.name] ?? {}) as DynamicFormInputs;
        const args = Reflect.getMetadata('design:paramtypes', target) || [];

        const opts = { ...formInputs, ...options } as DynamicFormInputs;
        if ((options.name || '').trim().length === 0) opts.name = key.replace(/\//g, '-').toLowerCase();
        if (options.initialValueFactory !== null) opts.initialValueFactory = () => Promise.resolve(new target(...args));
        _DYNAMIC_FORM_INPUTS[key] = opts
        Reflect.defineMetadata('DYNAMIC_FORM_INPUTS', opts, target);
    }
}



export function formInput(options: FormFieldOptions = { input: 'text' }) {
    return function (target: any, propertyKey: string) {

        if ('from' in options) options['input'] = 'fieldset'

        if (!options['input']) {
            // get the type of the property
            const type = Reflect.getMetadata("design:type", target, propertyKey);
            if (type === String) options['input'] = 'text'
            else if (type === Number) options['input'] = 'number'
            else if (type === Boolean) options['input'] = 'switch'
            else if (type === Array) options['input'] = 'select'
            else options['input'] = 'text'
        }
        const path = Reflect.getMetadata('path', target) || '';
        const field = toField(path, target, propertyKey, options);
        addInputToFormScheme(target, field, options);
    }
}

export function formField(options: FormFieldOptions & { name: string, type: 'field' }) {
    return toField('', undefined, options.name, options);
}