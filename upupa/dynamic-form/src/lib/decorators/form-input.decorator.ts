// make a property decorator that creates a FormFieldItem from a property
// export * from './lib/decorators/form-field.decorator';
import 'reflect-metadata';
import { Field, FieldItem, Fieldset, FormScheme, Validator } from '../types';
import { ActionDescriptor, toTitleCase } from '@upupa/common';
import { PasswordStrength } from '@upupa/auth';
import { DynamicFormInputs } from '../dynamic-form-inputs';
import { JsonPointer } from '@noah-ark/json-patch';
import {
    FormFieldOptions,
    SimpleDataAdapter,
    VisibleFormFieldOptions,
} from './decorators.types';
import { getLanguageInfo } from '@upupa/language';

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
};

const resolveDynamicFormOptionsFor = (
    target: any
): DynamicFormOptionsMetaData =>
    (Reflect.getMetadata(formSchemeMetadataKey, target) ??
        {}) as DynamicFormOptionsMetaData;

export const resolveFormSchemeOf = (target: any) =>
    resolveDynamicFormOptionsFor(target)?.fields;
export type DynamicFormOptions<T = any> = Omit<
    DynamicFormInputs<T>,
    'fields'
> & {
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
        opts.name = (opts.name ?? target.name)
            .trim()
            .toLowerCase()
            .replace(/\//g, '-');

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
        const inputs =
            resolveDynamicFormOptionsFor(target.constructor) ??
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

export function resolveFormViewmodelInputs(
    viewmodel: new <T = any>(...args: any[]) => T
): DynamicFormInputs &
    Pick<DynamicFormOptionsMetaData, 'actions' | 'onSubmitAction'> {
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
    const fields: FormScheme = buildFormScheme(
        formOptions as Pick<DynamicFormOptionsMetaData, 'fields' | 'locales'>
    );
    return { ...inputs, fields } as DynamicFormInputs &
        Pick<DynamicFormOptionsMetaData, 'actions' | 'onSubmitAction'>;
}

function buildFormScheme(
    info: Pick<DynamicFormOptionsMetaData, 'fields' | 'locales'>
): FormScheme {
    const result = {} as FormScheme;
    const { fields, locales } = info;
    for (const key in fields) {
        const { options, localize, target } = fields[key];
        result[key] = makeFieldItem(key, options, target, locales);
        // if (localize) {
        //     const fieldTranslations = _localizeField(
        //         result[key] as FieldItem,
        //         locales,
        //         options
        //     );
        // }
    }
    return result;
}

function makeFieldItem(
    propertyKey: string,
    options: Partial<FormFieldOptions>,
    target: any,
    locales?: DynamicFormOptionsMetaData['locales']
): Field {
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

    options['input'] = guessFieldInputType(target, propertyKey, options);

    const fieldBase = {
        name: propertyKey,
        validations: options.validations || [],
        ui: { inputs },
    } as Field;

    if (options['input'] === 'fieldset') {
        fieldBase.type = 'fieldset';
        const propType = Reflect.getMetadata(
            'design:type',
            target,
            propertyKey
        );
        const items =
            typeof propType === 'function'
                ? resolveFormSchemeOf(propType) ?? {}
                : {};

        (fieldBase as Fieldset).items = buildFormScheme({
            fields: items,
            locales: locales,
        });
        return fieldBase;
    }

    const input = options['input'];
    const field = {
        input,
        type: 'field',
        ...fieldBase,
    } as FieldItem;

    if (input.length === 0) field.input = 'hidden';

    if (input === 'array') {
        options['adapter'] = {
            dataSource: 'client',
            data: [],
        } as SimpleDataAdapter;
    }
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
    const formOptions = resolveDynamicFormOptionsFor(target);
    const fields = formOptions.fields ?? {};

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
    setDynamicFormOptionsMetadataFor(target, {
        ...formOptions,
        fields,
    });
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

const _localizeField = (
    field: FieldItem,
    locales: DynamicFormOptionsMetaData['locales'],
    formOptions: DynamicFormOptionsMetaData
): Fieldset | undefined => {
    if (!locales) return undefined;
    const defaultLocale = (locales.defaultLocale ?? '').trim();
    const translations = (locales.translations ?? []).filter((x) =>
        (x ?? '').trim()
    );

    if (!locales || !defaultLocale.length || !translations.length)
        return undefined;
    
    return undefined;
    // const translationFieldset = formOptions.fields['translations'] as Fieldset;
    // if (!translationFieldset) return undefined;

    // const fieldPath = field.path ?? `/${field.name}`;

    // const segments = fieldPath.split('/').filter((s) => s);

    // for (const locale of translations) {
    //     const p = [locale, ...segments].slice(0, -1);
    //     let b = '';
    //     let fieldset = null;
    //     for (const s of p) {
    //         b += `/${s}`;
    //         fieldset = JsonPointer.get(translationFieldset.items, `${b}`);
    //         if (!fieldset) {
    //             fieldset = makeTranslationFieldset(
    //                 s,
    //                 `translations${b}`,
    //                 getLanguageInfo(locale).nativeName
    //             );
    //             JsonPointer.set(translationFieldset.items, b, fieldset);
    //         }
    //     }

    //     const translationField = { ...(field as any) };
    //     translationField.path = `${fieldset['path']}${fieldPath}`;
    //     fieldset['items'][field.name] = translationField;
    // }

    // return translationFieldset;
};
