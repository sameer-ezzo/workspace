// make a property decorator that creates a FormFieldItem from a property
// export * from './lib/decorators/form-field.decorator';
import 'reflect-metadata';
import { Field, FieldItem, Fieldset, FormScheme, Validator } from '../types';
import { ActionDescriptor, toTitleCase } from '@upupa/common';
import { PasswordStrength } from '@upupa/auth';
import { DynamicFormInputs } from '../dynamic-form-inputs';
import { JsonPointer } from '@noah-ark/json-patch';
import { FormFieldOptions, VisibleFormFieldOptions } from './decorators.types';

const formSchemeMetadataKey = Symbol('custom:form_scheme_options');

export type DynamicFormOptionsMetaData = DynamicFormOptions & {
    fields: FormScheme;
    onSubmitAction?: Omit<ActionDescriptor, 'name'> & {
        name: 'onSubmit';
        handlerName: string;
    };
    actions: (ActionDescriptor & {
        handlerName: string;
    })[];
};

const setDynamicFormOptionsMetadataFor = (
    target: any,
    value: DynamicFormOptionsMetaData
) => {
    let targetOptions = resolveDynamicFormOptionsFor(target);
    const parent = target.prototype
        ? Object.getPrototypeOf(target.prototype)?.constructor
        : null;
    if (parent && parent.constructor)
        targetOptions = {
            ...resolveDynamicFormOptionsFor(parent),
            ...targetOptions,
        };

    Reflect.defineMetadata(
        formSchemeMetadataKey,
        { ...targetOptions, ...value },
        target
    );
    Reflect.defineMetadata(
        formSchemeMetadataKey,
        { ...targetOptions, ...value },
        target.constructor
    );
};

export const resolveDynamicFormOptionsFor = (
    target: any
): DynamicFormOptionsMetaData =>
    Object.assign(
        {},
        Reflect.getMetadata(formSchemeMetadataKey, target.constructor),
        Reflect.getMetadata(formSchemeMetadataKey, target)
    );

export const resolveFormSchemeOf = (target: any) =>
    resolveDynamicFormOptionsFor(target)?.fields;

function makeFieldItem(
    target: any,
    propertyKey: string,
    options: FormFieldOptions
): Field {
    if (!options['input']) {
        // get the type of the property
        const type = Reflect.getMetadata('design:type', target, propertyKey);
        if (type === Number) options['input'] = 'number';
        else if (type === Boolean) options['input'] = 'switch';
        else if (type === Array) options['input'] = 'select';
        else if (type === Date) options['input'] = 'date';
        else if (type === Object) options['input'] = 'fieldset';
        else options['input'] = 'text';
    }

    const opts = options as VisibleFormFieldOptions & FormFieldOptions;
    const label = opts.label ?? opts.text ?? toTitleCase(propertyKey);

    const fieldBase = {
        name: propertyKey,
        validations: options.validations || [],
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
            } as VisibleFormFieldOptions,
        },
    } as Field;
    delete fieldBase.ui.inputs['inputs'];
    fieldBase.ui.inputs = {
        ...fieldBase.ui.inputs,
        ...(options['inputs'] || {}),
    };

    if (options['input'] === 'fieldset') {
        fieldBase.type = 'fieldset';
        const propType = Reflect.getMetadata(
            'design:type',
            target,
            propertyKey
        );
        (fieldBase as Fieldset).items =
            propType && typeof propType === 'function'
                ? resolveFormSchemeOf(propType) ?? {}
                : {};
        return fieldBase;
    }

    const input = options['input'];
    const field = {
        input,
        type: 'field',
        ...fieldBase,
    } as FieldItem;

    if (input.length === 0) field.input = 'hidden';

    if (options['adapter']) {
        field.ui.inputs['_adapter'] = options['adapter'];
        delete field.ui.inputs['adapter'];
    }

    if (input === 'hidden') return field;

    if (input === 'switch') {
        const switchOptions = opts as any;
        field.ui.inputs['template'] = switchOptions.template ?? 'toggle';
        field.ui.inputs['renderer'] = switchOptions.renderer ?? 'none';
    }
    if (input === 'password') {
        const pwdOptions = opts as any;
        field.ui.inputs['showConfirmPasswordInput'] =
            pwdOptions.showConfirmPasswordInput ?? false;
        field.ui.inputs['showPassword'] = pwdOptions.showPassword ?? false;
        field.ui.inputs['canGenerateRandomPassword'] =
            pwdOptions.canGenerateRandomPassword ?? false;
        field.ui.inputs['passwordStrength'] =
            pwdOptions.passwordStrength ?? new PasswordStrength();
        field.ui.inputs['autocomplete'] =
            pwdOptions.autocomplete ?? 'new-password';
        return field;
    }

    if (input === 'file') {
        const fileOptions = opts as any;
        field.ui.inputs['minAllowedFiles'] = fileOptions.minAllowedFiles;
        field.ui.inputs['maxAllowedFiles'] = fileOptions.maxAllowedFiles;
        field.ui.inputs['path'] = fileOptions.path || field.path || '';
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
    if (input === 'html') {
        const htmlOptions = opts as any;
        field.ui.inputs['uploadPath'] = htmlOptions.path || '';
        return field;
    }
    return field;
}
function addInputToFormScheme(path: string, field: Field, target: any) {
    const formOptions =
        resolveDynamicFormOptionsFor(target) ??
        ({} as DynamicFormOptionsMetaData);
    const fields = formOptions.fields ?? {};

    path ??= field.name;

    const segments = path.split('/').filter((s) => s);
    if (segments.length === 1) {
        field.path = `/${field.name}`;
        JsonPointer.set(fields, path, field as FieldItem);
    } else {
        let p = path;
        while (segments.length > 1) {
            const segment = segments.shift()!;
            p = `${p}/${segment}`;
            const vos = JsonPointer.get(fields, p);
            if (!vos) {
                JsonPointer.set(fields, p, {
                    type: 'fieldset',
                    name: segment,
                    path: p,
                    items: {},
                } as Fieldset);
            }
        }
    }
    setDynamicFormOptionsMetadataFor(target.constructor, {
        ...formOptions,
        fields,
    });
}
export const toField = (
    target: any,
    propertyKey: string,
    options: FormFieldOptions
) => makeFieldItem(target, propertyKey, options);

export type DynamicFormOptions<T = any> = Omit<
    DynamicFormInputs<T>,
    'fields'
> & {
    locales?: { defaultLocale: string; translations: string[] };
    path?: string;
};

export function formScheme(options?: DynamicFormOptions) {
    return function (target: any) {
        const formOptions =
            resolveDynamicFormOptionsFor(target) ??
            ({} as DynamicFormOptionsMetaData);

        const currentFields = formOptions?.['fields'] ?? {};
        const optionsFields = options?.['fields'] ?? {};
        const fields = { ...currentFields, ...optionsFields } as FormScheme;
        const opts = {
            ...formOptions,
            ...options,
            fields,
        };
        if ((opts.name || '').trim().length === 0)
            opts.name = target.name.replace(/\//g, '-').toLowerCase();

        setDynamicFormOptionsMetadataFor(target.constructor, opts);
        const translationFieldset = makeLocalesInputs(opts);
        if (translationFieldset) {
            addInputToFormScheme('translations', translationFieldset, target);
        }
    };
}

// type DataTableRowActionDescriptor = { order?: number } & (
//   | ActionDescriptor
//   | ((row: any) => ActionDescriptor)
// );

export function submitAction(action: Partial<Omit<ActionDescriptor, 'name'>>) {
    return function (target: any, propertyKey: string) {
        const inputs =
            resolveDynamicFormOptionsFor(target) ??
            ({} as DynamicFormOptionsMetaData);

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

export function formAction(
    action: Partial<ActionDescriptor> & { order?: number }
) {
    return function (target: any, propertyKey: string) {
        const inputs =
            resolveDynamicFormOptionsFor(target) ??
            ({} as DynamicFormOptionsMetaData);
        inputs.actions ??= [];

        const _action = {
            ...action,
            name: action.name || propertyKey,
            handlerName: propertyKey,
            order: action.order ?? inputs.actions.length,
        };
        inputs.actions.push(_action);
        setDynamicFormOptionsMetadataFor(target.constructor, inputs);
    };
}
const makeLocalesInputs = (
    formOptions: DynamicFormOptionsMetaData
): Fieldset | undefined => {
    const { locales } = formOptions;
    if (!locales) return undefined;
    const defaultLocale = (locales.defaultLocale ?? '').trim();
    const translations = (locales.translations ?? []).filter((x) =>
        (x ?? '').trim()
    );

    if (!locales || !defaultLocale.length || !translations.length)
        return undefined;

    const translationField = (name, path, label) => {
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
    const translationsFields = translations.reduce((acc, locale) => {
        return {
            ...acc,
            [locale]: translationField(
                locale,
                `/translations/${locale}`,
                locale
            ),
        };
    }, {});

    const fields = formOptions['fields'];
    const fieldEntries = Object.entries(fields);
    const translationFieldset = translationField(
        'translations',
        '/translations',
        'Translations'
    );
    for (const [name, field] of fieldEntries) {
        if (field['ui']?.['inputs']?.['localize'] !== true) continue;
        const entries = Object.entries(translationsFields);
        for (const [locale, fieldset] of entries) {
            const translationField = { ...(field as any) };
            translationField.path = `${fieldset['path']}${translationField.path}`;
            fieldset['items'][name] = translationField;
            translationFieldset.items[locale] = fieldset as Field;
        }
    }
    return translationFieldset;
};

export function localizedInput(options: FormFieldOptions) {
    return function (target: any, propertyKey: string) {
        options['localize'] = true;
        formInput(options)(target, propertyKey);
    };
}

export function formInput(options: FormFieldOptions = { input: 'text' }) {
    return function (target: any, propertyKey: string) {
        const field = toField(target, propertyKey, options);
        addInputToFormScheme(propertyKey, field, target);
    };
}

export function formField(
    options: FormFieldOptions & { name: string; type: 'field' }
) {
    return toField(undefined, options.name, options);
}
