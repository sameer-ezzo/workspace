// make a property decorator that creates a FormFieldItem from a property
// export * from './lib/decorators/form-field.decorator';
import 'reflect-metadata';
import { Field, FieldItem, Fieldset, FormScheme, Validator } from '../types';
import { ActionDescriptor, toTitleCase } from '@upupa/common';
import { PasswordStrength } from '@upupa/auth';
import { DynamicFormInputs } from '../dynamic-form-inputs';
import { JsonPointer } from '@noah-ark/json-patch';
import { FormFieldOptions, VisibleFormFieldOptions } from './decorators.types';
import { getLanguageInfo } from '@upupa/language';
import { DataAdapterDescriptor } from '@upupa/data';

const formSchemeMetadataKey = Symbol('custom:form_scheme_options');

export type DynamicFormOptionsMetaData = DynamicFormOptions & {
    fields: Record<
        string,
        {
            options: Partial<FormFieldOptions>;
            localize: boolean | undefined;
            target: any;
        }
    >;
    onSubmitAction?: Omit<ActionDescriptor, 'name'> & {
        name: 'onSubmit';
        handlerName: string;
    };
    actions: (ActionDescriptor & {
        handlerName: string;
    })[];
};

const setDynamicFormOptionsMetadataFor = (target: any, value: DynamicFormOptionsMetaData) => {
    let targetOptions = resolveDynamicFormOptionsFor(target);
    const parent = target.prototype ? Object.getPrototypeOf(target.prototype)?.constructor : null;

    if (parent && parent.constructor)
        targetOptions = {
            ...resolveDynamicFormOptionsFor(parent),
            ...targetOptions,
        };

    Reflect.defineMetadata(formSchemeMetadataKey, { ...targetOptions, ...value }, target);
};

const resolveDynamicFormOptionsFor = (target: any): DynamicFormOptionsMetaData => (Reflect.getMetadata(formSchemeMetadataKey, target) ?? {}) as DynamicFormOptionsMetaData;

export const resolveFormSchemeOf = (target: any) => resolveDynamicFormOptionsFor(target)?.fields;
export type DynamicFormOptions<T = any> = Omit<DynamicFormInputs<T>, 'fields'> & {
    locales?: { defaultLocale: string; translations: string[] };
};

export function formScheme(options?: DynamicFormOptions) {
    return function (target: any) {
        const formOptions = resolveDynamicFormOptionsFor(target);

        // const currentFields = formOptions?.['fields'] ?? {};

        const opts = {
            ...formOptions,
            ...options,
        };
        // opts.fields = {
        //     ...currentFields,
        //     ...(options?.['fields'] ?? {}),
        // } as FormScheme;
        opts.name = (opts.name ?? target.name).trim().toLowerCase().replace(/\//g, '-');

        // append translations fieldset to the end of the form fields
        // const translations = opts.fields['translations'];
        // if (translations) {
        //     delete opts.fields['translations'];
        //     opts.fields['translations'] = translations;
        // }

        setDynamicFormOptionsMetadataFor(target, opts);
    };
}
export function submitAction(action: Partial<Omit<ActionDescriptor, 'name'>>) {
    return function (target: any, propertyKey: string) {
        const inputs = resolveDynamicFormOptionsFor(target.constructor) ?? ({} as DynamicFormOptionsMetaData);

        const submitAction = {
            ...action,
            name: 'onSubmit',
            type: 'submit',
            handlerName: propertyKey,
        };
        inputs.onSubmitAction = submitAction as any;
        setDynamicFormOptionsMetadataFor(target.constructor, inputs);
    };
}

export function formAction(action: Partial<ActionDescriptor> & { order?: number }) {
    return function (target: any, propertyKey: string) {
        const inputs = resolveDynamicFormOptionsFor(target) ?? ({} as DynamicFormOptionsMetaData);
        inputs.actions ??= [];

        const _action = {
            ...action,
            name: action.name || propertyKey,
            handlerName: propertyKey,
            order: action.order ?? inputs.actions.length,
        };
        inputs.actions.push(_action);
        setDynamicFormOptionsMetadataFor(target, inputs);
    };
}

export function localizedInput(options: FormFieldOptions) {
    return function (target: any, propertyKey: string) {
        const fieldOpts = { ...options };
        fieldOpts['localize'] = true;
        formInput(fieldOpts)(target, propertyKey);
    };
}
function guessFieldInputType(target, propertyKey, options): string {
    let input = options['input'];
    if (input) return input;
    // get the type of the property
    const type = Reflect.getMetadata('design:type', target, propertyKey);
    if (type === Number) return 'number';
    else if (type === Boolean) return 'switch';
    else if (type === Array) return 'select';
    else if (type === Date) return 'date';
    else if (type === Object) return 'fieldset';
    else if (typeof type === 'function') return 'fieldset';
    else return 'text';
}

export function formInput(options: FormFieldOptions = { input: 'text' }) {
    return function (target: any, propertyKey: string) {
        const opts = resolveDynamicFormOptionsFor(target.constructor);
        opts.fields ??= {};
        const localize = options['localize'];
        delete options['localize'];
        opts.fields[propertyKey] = { options, localize, target };
        setDynamicFormOptionsMetadataFor(target.constructor, opts);
    };
}

export function resolveFormViewmodelInputs(viewmodel: new <T = any>(...args: any[]) => T): DynamicFormInputs & Pick<DynamicFormOptionsMetaData, 'actions' | 'onSubmitAction'> {
    const formOptions = resolveDynamicFormOptionsFor(viewmodel);
    const inputs = {
        conditions: formOptions.conditions,
        name: formOptions.name ?? viewmodel.name,
        preventDirtyUnload: formOptions.preventDirtyUnload,
        recaptcha: formOptions.recaptcha,
        theme: formOptions.theme,
        actions: formOptions.actions,
        onSubmitAction: formOptions.onSubmitAction,
    };
    const fields = {} as FormScheme;

    buildFormScheme('', formOptions as Pick<DynamicFormOptionsMetaData, 'fields' | 'locales'>, fields);

    return { ...inputs, fields } as DynamicFormInputs & Pick<DynamicFormOptionsMetaData, 'actions' | 'onSubmitAction'>;
}

function sortFields(fields: [string, { options: Partial<FormFieldOptions>; localize: boolean; target: any }][]) {
    return fields.sort((a, b) => a[1].options['order'] - b[1].options['order']);
}

function sortFieldsByOrder(fields: DynamicFormOptionsMetaData['fields']) {
    const entries = Object.entries(fields);
    const orderedEntries = sortFields(entries.filter(([k, v]) => v.options['order'] !== undefined));
    const minOrder = orderedEntries[0]?.[1]['options']['order'] ?? 0;
    for (let idx = 0; idx < entries.length; idx++) {
        const [key, fieldInfo] = entries[idx];
        if (fieldInfo.options['order'] === undefined) {
            fieldInfo.options['order'] = minOrder + idx;
        }
    }
    return sortFields(entries);
}
function buildFormScheme(parentPath: string, info: Pick<DynamicFormOptionsMetaData, 'fields' | 'locales'>, parentFormScheme: FormScheme): void {
    const { fields, locales } = info;
    const fieldNamesSorted = sortFieldsByOrder(fields);

    for (const [key, fieldInfo] of fieldNamesSorted) {
        const { options, localize, target } = fieldInfo;
        const input = guessFieldInputType(target, key, options);
        //todo: introduce array field type instead of using fieldset

        if (input === 'fieldset' || input === 'array') makeFieldset(parentPath, key, options, target, localize, locales, parentFormScheme);
        else makeFieldItem(parentPath, key, options, target, localize, locales, parentFormScheme);
    }

    const translationsFieldset = parentFormScheme['translations'];
    delete parentFormScheme['translations'];
    if (translationsFieldset && Object.keys(translationsFieldset)) parentFormScheme['translations'] = translationsFieldset;

    console.log(parentPath, 'parentFormScheme', parentFormScheme);
}

function makeFormFieldOptions(propertyKey: string, options: Partial<FormFieldOptions>) {
    const opts = options ?? {};
    const label = opts['label'] ?? toTitleCase(propertyKey);

    const inputs = {
        required: options.required,
        text: opts['text'],
        hidden: opts['hidden'] === true,
        label,
        placeholder: opts['placeholder'],
        appearance: opts['appearance'],
        fieldName: propertyKey,
        // ...options,
        ...(options['inputs'] || {}),
    } as VisibleFormFieldOptions;

    if ('readonly' in inputs) inputs['readonly'] = inputs['readonly'] === true;
    if ('disabled' in inputs) inputs['disabled'] = inputs['disabled'] === true;

    const fieldBase = {
        name: propertyKey,
        validations: options.validations || [],
        ui: { inputs },
    } as Field;
    return fieldBase;
}

function makeFieldItem(
    parentPath: string,
    propertyKey: string,
    options: Partial<FormFieldOptions>,
    target: any,
    localize: boolean,
    locales: DynamicFormOptionsMetaData['locales'],
    parentFormScheme: FormScheme
) {
    const make = (field: FieldItem, options: Partial<FormFieldOptions>) => {
        if (localize) _localizeField(field, locales, parentFormScheme, options);
        JsonPointer.set(parentFormScheme, field.path, field);
    };

    const fieldBase = makeFormFieldOptions(propertyKey, options);
    const input = guessFieldInputType(target, propertyKey, options);
    const path = [parentPath, propertyKey].join('/');

    const field = {
        ...fieldBase,
        type: 'field',
        path,
        input,
    } as FieldItem;

    if (input.length === 0) field.input = 'hidden';

    if (input === 'array' || options['adapter']) {
        const descriptor: DataAdapterDescriptor = options['adapter'] ?? { type: 'client', data: [] };
        field.ui.inputs['_adapter'] = descriptor;
        delete field.ui.inputs['adapter'];
        field.ui.inputs['minAllowed'] = options['minAllowed'] ?? 1;
        field.ui.inputs['maxAllowed'] = options['maxAllowed'] ?? 1;
    }

    if (input === 'hidden') return make(field, options);

    if (input === 'switch') {
        const switchOptions = options as any;
        field.ui.inputs['template'] = switchOptions.template ?? 'toggle';
        field.ui.inputs['renderer'] = switchOptions.renderer ?? 'none';
    }
    if (input === 'password') {
        const pwdOptions = options as any;
        field.ui.inputs['showConfirmPasswordInput'] = pwdOptions.showConfirmPasswordInput ?? false;
        field.ui.inputs['showPassword'] = pwdOptions.showPassword ?? false;
        field.ui.inputs['canGenerateRandomPassword'] = pwdOptions.canGenerateRandomPassword ?? false;
        field.ui.inputs['passwordStrength'] = pwdOptions.passwordStrength ?? new PasswordStrength();
        field.ui.inputs['autocomplete'] = pwdOptions.autocomplete ?? 'new-password';
        return make(field, options);
    }

    if (input === 'file') {
        const fileOptions = options as any;
        field.ui.inputs['minAllowedFiles'] = fileOptions.minAllowedFiles;
        field.ui.inputs['maxAllowedFiles'] = fileOptions.maxAllowedFiles;
        field.ui.inputs['path'] = fileOptions.path || field.path || field.name;
        field.ui.inputs['accept'] = fileOptions.accept || '*.*';
        field.ui.inputs['view'] = fileOptions.view || 'list';
        field.ui.inputs['fileSelector'] = fileOptions.fileSelector || 'system';
        field.ui.inputs['color'] = fileOptions.color || 'accent';
        field.ui.inputs['dateFormat'] = fileOptions.dateFormat || 'dd MMM yyyy';
        field.ui.inputs['includeAccess'] = fileOptions.includeAccess || false;
        field.ui.inputs['minSize'] = fileOptions.minSize || 0;
        field.ui.inputs['maxSize'] = fileOptions.maxSize || 1024 * 1024 * 10;
        return make(field, options);
    }
    if (input === 'html') {
        const htmlOptions = options as any;
        field.ui.inputs['uploadPath'] = htmlOptions.path || field.path || field.name;
        return make(field, options);
    }

    return make(field, options);
}

function makeFieldset(
    parentPath: string,
    name: string,
    options: Partial<FormFieldOptions>,
    target: any,
    localize: boolean,
    locales: DynamicFormOptionsMetaData['locales'],
    parentFormScheme: FormScheme
) {
    const path = [parentPath, name].join('/');
    const fieldset = { ...makeFormFieldOptions(name, options), type: 'fieldset', path, items: {} } as Fieldset;

    const propType = options.input?.['viewmodel'] ?? Reflect.getMetadata('design:type', target, name);
    const fieldsetFormOptions: DynamicFormOptionsMetaData = typeof propType === 'function' ? resolveDynamicFormOptionsFor(propType) : ({} as DynamicFormOptionsMetaData);
    buildFormScheme(
        parentPath,
        {
            fields: fieldsetFormOptions.fields,
            locales: locales,
        },
        fieldset.items
    );

    const translationsFieldset = fieldset.items['translations'];
    delete fieldset.items['translations'];
    if (translationsFieldset && Object.keys(translationsFieldset)) fieldset.items['translations'] = translationsFieldset;

    parentFormScheme[fieldset.name] = fieldset;
}

const makeTranslationFieldset = (name, path, label): Fieldset => {
    return {
        type: 'fieldset',
        input: 'fieldset',
        name,
        items: {},
        path,
        ui: {
            inputs: {
                label,
            },
        },
    } as Fieldset;
};

const _localizeField = (field: FieldItem, locales: DynamicFormOptionsMetaData['locales'], parentFormScheme: FormScheme, options: Partial<FormFieldOptions>): void => {
    if (!locales) return;
    const defaultLocale = (locales.defaultLocale ?? '').trim();
    const translations = (locales.translations ?? []).filter((x) => (x ?? '').trim());
    if (!defaultLocale.length || !translations.length) return;

    const translationFieldset = JsonPointer.get(parentFormScheme, '/translations') ?? makeTranslationFieldset('translations', '/translations', 'Translations');

    const fieldPath = field.path ?? `/${field.name}`;

    const segments = fieldPath.split('/').filter((s) => s);

    for (const locale of translations) {
        const p = [locale, ...segments].slice(0, -1);
        let b = '';
        let fieldset = null;
        for (const s of p) {
            b += `/${s}`;
            fieldset = JsonPointer.get(translationFieldset.items, `${b}`);
            if (!fieldset) {
                fieldset = makeTranslationFieldset(s, `translations${b}`, getLanguageInfo(locale).nativeName);
                JsonPointer.set(translationFieldset.items, b, fieldset);
            }
        }

        const translationField = { ...(field as any) };
        translationField.path = `${fieldset['path']}${fieldPath}`;
        JsonPointer.set(fieldset.items, field.name, translationField);
        JsonPointer.set(parentFormScheme, 'translations', translationFieldset);
    }
};
