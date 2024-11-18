// make a property decorator that creates a FormField from a property
// export * from './lib/decorators/form-field.decorator';
import "reflect-metadata";
import { Field, Fieldset, FormScheme, SET_INPUTS } from "../types";
import { ActionDescriptor, DynamicComponent, toTitleCase } from "@upupa/common";
import { PasswordStrength } from "@upupa/auth";
import { DynamicFormInputs } from "../dynamic-form-inputs";
import { FieldInputType, FieldOptions, VisibleFormFieldOptions } from "./decorators.types";
import { getLanguageInfo } from "@upupa/language";
import { DataAdapterDescriptor } from "@upupa/data";
import { Class } from "@noah-ark/common";
import { cloneDeep } from "lodash";
import { TableHeaderComponent } from "@upupa/table";

const FORM_METADATA_KEY = Symbol("custom:form_scheme_options");

function reflectFormMetadata(targetClass: any): DynamicFormOptionsMetaData {
    return Reflect.getMetadata(FORM_METADATA_KEY, targetClass) as DynamicFormOptionsMetaData;
}

function defineFormMetadata(targetClass: any, value: DynamicFormOptionsMetaData) {
    let targetOptions = reflectFormMetadata(targetClass);
    const parent = targetClass.prototype ? Object.getPrototypeOf(targetClass.prototype)?.constructor : null;

    if (parent && parent.constructor)
        targetOptions = {
            ...reflectFormMetadata(parent),
            ...targetOptions,
        };

    Reflect.defineMetadata(FORM_METADATA_KEY, { ...targetOptions, ...value }, targetClass);
}

function createFormMetadata(): DynamicFormOptionsMetaData {
    return {
        fields: {},
        targets: {},
        groups: {},
    };
}

export type DynamicFormOptionsMetaData = DynamicFormOptions & {
    fields: Record<string, Field>;
    targets: Record<string, any>;
    groups: Record<string, string>;

    onSubmitAction?: Omit<ActionDescriptor, "name"> & {
        name: "onSubmit";
        handlerName: string;
    };
    actions?: (ActionDescriptor & {
        handlerName: string;
    })[];
};

function inferFieldInputType(property: any, propertyKey: string, field: Partial<FieldOptions>): FieldOptions["input"] {
    let input = field?.["input"];
    if (input) return input;

    const type = Reflect.getMetadata("design:type", property, propertyKey);
    if (type === Number) return "number";
    else if (type === Boolean) return "switch";
    else if (type === Array) return "array";
    else if (type === Date) return "date";
    else if (type === Object) return "object";
    else if (typeof type === "function") return "object";
    else return "text";
}

export function formInput(opt?: Partial<FieldOptions>) {
    return (property: any, propertyKey: string) => {
        const metadata = reflectFormMetadata(property.constructor) ?? createFormMetadata();

        opt ??= { input: inferFieldInputType(property, propertyKey, opt) };
        opt.input ??= inferFieldInputType(property, propertyKey, opt);
        const f = fillFieldInputs(propertyKey, opt);

        metadata.fields[propertyKey] = f;
        metadata.targets[propertyKey] = property;
        metadata.groups[propertyKey] = opt.group;

        defineFormMetadata(property.constructor, metadata);
    };
}

export type DynamicFormOptions<T = any> = Omit<DynamicFormInputs<T>, "fields"> & {
    locales?: { defaultLocale: string; translations: string[] };
};

export function formScheme(options?: DynamicFormOptions) {
    return function (target: any) {
        const formOptions = reflectFormMetadata(target);

        // const currentFields = formOptions?.['fields'] ?? {};

        const opts = {
            ...formOptions,
            ...options,
        };
        // opts.fields = {
        //     ...currentFields,
        //     ...(options?.['fields'] ?? {}),
        // } as FormScheme;
        opts.name = (opts.name ?? target.name).trim().toLowerCase().replace(/\//g, "-");

        // append translations fieldset to the end of the form fields
        // const translations = opts.fields['translations'];
        // if (translations) {
        //     delete opts.fields['translations'];
        //     opts.fields['translations'] = translations;
        // }

        defineFormMetadata(target, opts);
    };
}

export function submitAction(action?: Partial<Omit<ActionDescriptor, "name">>) {
    return function (target: any, propertyKey: string) {
        const inputs = reflectFormMetadata(target.constructor) ?? ({} as DynamicFormOptionsMetaData);

        const submitAction = {
            text: "Submit",
            color: "primary",
            variant: "raised",
            ...(action ?? {}),
            name: "onSubmit",
            type: "submit",
            handlerName: propertyKey,
        };
        inputs.onSubmitAction = submitAction as any;
        defineFormMetadata(target.constructor, inputs);
    };
}

export function formAction(action: Partial<ActionDescriptor> & { order?: number }) {
    return function (target: any, propertyKey: string) {
        const inputs = reflectFormMetadata(target) ?? ({} as DynamicFormOptionsMetaData);
        inputs.actions ??= [];

        const _action = {
            ...action,
            name: action.name || propertyKey,
            handlerName: propertyKey,
            order: action.order ?? inputs.actions.length,
        };
        inputs.actions.push(_action);
        defineFormMetadata(target, inputs);
    };
}

export type FormViewModelMirror = {
    viewModelType: Class;
} & DynamicFormInputs &
    Pick<DynamicFormOptionsMetaData, "actions" | "onSubmitAction">;

export function reflectFormViewModelType(viewModel: Class): FormViewModelMirror {
    const formMetadata = reflectFormMetadata(viewModel);
    const inputs = {
        conditions: formMetadata.conditions,
        name: formMetadata.name ?? viewModel.name,
        preventDirtyUnload: formMetadata.preventDirtyUnload,
        recaptcha: formMetadata.recaptcha,
        theme: formMetadata.theme,
        actions: formMetadata.actions,
        onSubmitAction: formMetadata.onSubmitAction,
    };

    const fields = {} as FormScheme;

    const _currentFields = Object.entries(formMetadata.fields);
    while (_currentFields.length) {
        const [fieldName, field] = _currentFields.shift();
        const groupName = formMetadata.groups[fieldName];
        if (groupName || field.input === "group") {
            const group = (fields[groupName] as Fieldset) ?? {
                input: "group",
                items: {},
                inputs: { label: toTitleCase(groupName) },
            };

            group.items[fieldName] = field;
            fields[groupName] = group;
        } else if (field.input === "object" || field.input === "fieldset") {
            const type = Reflect.getMetadata("design:type", formMetadata.targets[fieldName], fieldName);
            const childMirror = reflectFormViewModelType(type);
            fields[fieldName] = { ...field, input: "object", items: childMirror.fields };
        } else {
            fields[fieldName] = field;
        }
    }

    return { viewModelType: viewModel, ...inputs, fields };
}

// function sortFields(fields: [string, { options: Partial<FormFieldOptions>; localize: boolean; target: any }][]) {
//     return fields.sort((a, b) => a[1].options["order"] - b[1].options["order"]);
// }

// function sortFieldsByOrder(fields: DynamicFormOptionsMetaData["fields"]) {
//     const entries = Object.entries(fields ?? {});
//     const orderedEntries = sortFields(entries.filter(([k, v]) => v.options["order"] !== undefined));
//     const minOrder = orderedEntries[0]?.[1]["options"]["order"] ?? 0;
//     for (let idx = 0; idx < entries.length; idx++) {
//         const [key, fieldInfo] = entries[idx];
//         if (fieldInfo.options["order"] === undefined) {
//             fieldInfo.options["order"] = minOrder + idx;
//         }
//     }
//     const sortedFields = sortFields(entries);

//     const result: DynamicFormOptionsMetaData["fields"] = {};

//     for (const [fieldName, f] of sortedFields) {
//         if (f.options["group"]) {
//             const groupInfo = f.options["group"];
//             const groupName = groupInfo.name;
//             result[groupName] ??= { localize: f.localize, options: { ...groupInfo, input: "group", items: new Map<string, any>() } as any, target: f.target };
//             (result[groupName].options as any).items.set(fieldName, f.options);
//         } else {
//             result[fieldName] = f;
//         }
//     }

//     console.log(result);
//     return Object.entries(result);
// }

// function buildFormScheme(info: Pick<DynamicFormOptionsMetaData, "fields" | "locales">, parentFormScheme: Map<string, Field>): void {
//     const { fields, locales } = info;
//     const fieldNamesSorted = sortFieldsByOrder(fields);

//     for (const [key, fieldInfo] of fieldNamesSorted) {
//         const { options, localize, target } = fieldInfo;
//         const input = guessFieldInputType(target, key, options);
//         //todo: introduce array field type instead of using fieldset

//         if (input === "fieldset") makeFieldset(key, options, target, localize, locales, parentFormScheme);
//         else if (input === "group") makeFieldset(key, options, target, localize, locales, parentFormScheme);
//         else makeField(key, options, target, localize, locales, parentFormScheme);
//     }

//     const translationsFieldset = parentFormScheme.get("translations");
//     parentFormScheme.delete("translations");
//     if (translationsFieldset && Object.keys(translationsFieldset)) parentFormScheme.set("translations", translationsFieldset);
// }

// function makeFormFieldOptions(fieldName: string, options: Partial<FormFieldOptions>) {
//     const opts = options ?? {};
//     const label = opts["label"] ?? toTitleCase(fieldName);

//     const inputs = {
//         required: opts["required"] === true,
//         text: opts["text"],
//         hidden: opts["hidden"] === true,
//         label,
//         placeholder: opts["placeholder"],
//         appearance: opts["appearance"],
//         fieldName,
//         hint: opts["hint"],
//         ...(opts["inputs"] || {}),
//     } as VisibleFormFieldOptions;

//     if (opts["floatLabel"] && !inputs.floatLabel) inputs.floatLabel = opts["floatLabel"];
//     if ("readonly" in inputs) inputs["readonly"] = inputs["readonly"] === true;
//     if ("disabled" in inputs) inputs["disabled"] = inputs["disabled"] === true;

//     return {
//         name: fieldName,
//         validations: options["validations"] || [],
//         ui: { inputs },
//     } as unknown as Field;
// }

// function makeField(
//     fieldName: string,
//     options: Partial<FormFieldOptions>,
//     target: any,
//     localize: boolean,
//     locales: DynamicFormOptionsMetaData["locales"],
//     parentFormScheme: Map<string, Field>,
// ) {
//     const fieldBase = makeFormFieldOptions(fieldName, options);
//     const input = guessFieldInputType(target, fieldName, options);

//     const field = fillFieldInputs(fieldName, fieldBase, input as any, options);
//     if (localize) _localizeField(fieldName, field, locales, parentFormScheme, options);
//     parentFormScheme[fieldName] = field;
// }

// function makeFieldset(
//     name: string,
//     options: Partial<FormFieldOptions>,
//     target: any,
//     localize: boolean,
//     locales: DynamicFormOptionsMetaData["locales"],
//     parentFormScheme: Map<string, Field>,
// ) {
//     const fieldset = { ...makeFormFieldOptions(name, options), input: "object", items: new Map<string, Field>() } as Fieldset;

//     const propType = options.input?.["viewModel"] ?? Reflect.getMetadata("design:type", target, name);
//     const mirror: FormViewModelMirror = typeof propType === "function" ? reflectFormViewModelType(propType) : ({} as FormViewModelMirror);
//     fieldset.items = mirror.fields;
//     parentFormScheme.set(name, fieldset);
// }

// const makeTranslationFieldset = (name, label): Fieldset => {
//     return {
//         input: "object",
//         items: {},
//         ui: {
//             inputs: {
//                 label,
//             },
//         },
//     } as Fieldset;
// };

// const _localizeField = (
//     name: string,
//     field: Field,
//     locales: DynamicFormOptionsMetaData["locales"],
//     parentFormScheme: Map<string, Field>,
//     options: Partial<FormFieldOptions>,
// ): void => {
//     if ("items" in field) return;

//     if (!locales) return;
//     const defaultLocale = (locales.defaultLocale ?? "").trim();
//     const translations = (locales.translations ?? []).filter((x) => (x ?? "").trim());
//     if (!defaultLocale.length || !translations.length) return;

//     parentFormScheme["translations"] ??= makeTranslationFieldset("translations", "Translations");
//     const translationFieldset = parentFormScheme["translations"] as Fieldset;

//     for (const locale of translations) {
//         let localeFieldset = (translationFieldset.items[locale] as Fieldset) ?? makeTranslationFieldset(locale, getLanguageInfo(locale).nativeName);
//         const translationField = cloneDeep(field);
//         localeFieldset.items[name] = translationField;
//         translationFieldset.items[locale] = localeFieldset;
//     }
// };

export function formInputArray(tableViewModel: Class, config: { inlineEndSlot?: DynamicComponent[]; showSearch?: boolean } = { inlineEndSlot: [], showSearch: false }, options?: Partial<FieldOptions>) {
    return formInput({
        ...options,
        input: "table",
        inputs: {
            viewModel: tableViewModel,
            tableHeaderComponent: {
                component: TableHeaderComponent,
                inputs: {
                    showSearch: config?.showSearch ?? false,
                    inlineEndSlot: config?.inlineEndSlot ?? [],
                },
            },
        },
    });
}

function fillFieldInputs(fieldName: string, fieldOptions: Partial<FieldOptions>): Field {
    const input = fieldOptions.input;

    const field: Field = {
        input,
        inputs: { ...fieldOptions.inputs },
        validations: [],
    };

    if (fieldOptions["adapter"]) {
        const descriptor: DataAdapterDescriptor = fieldOptions["adapter"] ?? { type: "client", data: [] };
        field.inputs["_adapter"] = descriptor;
        field.inputs["minAllowed"] = fieldOptions["minAllowed"];
        field.inputs["maxAllowed"] = fieldOptions["maxAllowed"];
    }

    if (fieldOptions["required"]) {
        field.inputs["required"] = fieldOptions["required"];
    }

    if (fieldOptions.validations?.length) {
        field.validations = fieldOptions.validations;
    }

    field.inputs["label"] = fieldOptions["label"] ?? field.inputs["label"] ?? toTitleCase(fieldName);

    switch (input) {
        case "select":
            break;
        case "array":
            break;
        case "checks":
        case "radios":
            field.inputs["direction"] = fieldOptions.direction ?? "vertical";
            field.inputs["template"] = fieldOptions.template ?? "normal";
            field.inputs["thumbSize"] = fieldOptions.thumbSize ?? 50;
            field.inputs["renderer"] = fieldOptions.renderer ?? "none";
            break;
        case "object":
        case "fieldset":
            break;
        case "switch":
            const switchOptions = fieldOptions as any;
            field.inputs["template"] = switchOptions.template ?? "toggle";
            field.inputs["renderer"] = switchOptions.renderer ?? "none";
            break;
        case "password":
            const pwdOptions = fieldOptions as any;
            field.inputs["showConfirmPasswordInput"] = pwdOptions.showConfirmPasswordInput ?? false;
            field.inputs["showPassword"] = pwdOptions.showPassword ?? false;
            field.inputs["canGenerateRandomPassword"] = pwdOptions.canGenerateRandomPassword ?? false;
            field.inputs["passwordStrength"] = pwdOptions.passwordStrength ?? new PasswordStrength();
            field.inputs["autocomplete"] = pwdOptions.autocomplete ?? "new-password";
            break;
        case "file":
            const fileOptions = fieldOptions as any;
            field.inputs["minAllowedFiles"] = fileOptions.minAllowedFiles;
            field.inputs["maxAllowedFiles"] = fileOptions.maxAllowedFiles;
            field.inputs["path"] = fileOptions.path || fieldName;
            field.inputs["accept"] = fileOptions.accept || "*.*";
            field.inputs["view"] = fileOptions.view || "list";
            field.inputs["fileSelector"] = fileOptions.fileSelector || "system";
            field.inputs["color"] = fileOptions.color || "accent";
            field.inputs["dateFormat"] = fileOptions.dateFormat || "dd MMM yyyy";
            field.inputs["includeAccess"] = fileOptions.includeAccess || false;
            field.inputs["minSize"] = fileOptions.minSize || 0;
            field.inputs["maxSize"] = fileOptions.maxSize || 1024 * 1024 * 10;
            break;
        case "html":
            const htmlOptions = fieldOptions as any;
            field.inputs["uploadPath"] = htmlOptions.uploadPath || fieldName;
            break;
        case "date":
            break;
        case "text":
            break;
        case "number":
            break;
        case "hidden":
            break;
        case "chips":
            break;
        case "textarea":
            if (field["rows"]) field.inputs["rows"] = field["rows"];
            if (field["maxRows"]) field.inputs["maxRows"] = field["maxRows"];
            if (field["minSize"]) field.inputs["minSize"] = field["minSize"];

            break;

        default:
            field.inputs = { ...field.inputs, ...field };
    }

    // return make(field, options);

    // if (input.length === 0) field.input = 'hidden';

    // if (input === 'hidden') return make(field, options);

    // if (input === 'switch') {
    //     const switchOptions = options as any;
    //     field.inputs['template'] = switchOptions.template ?? 'toggle';
    //     field.inputs['renderer'] = switchOptions.renderer ?? 'none';
    // }
    // if (input === 'password') {
    //     const pwdOptions = options as any;
    //     field.inputs['showConfirmPasswordInput'] = pwdOptions.showConfirmPasswordInput ?? false;
    //     field.inputs['showPassword'] = pwdOptions.showPassword ?? false;
    //     field.inputs['canGenerateRandomPassword'] = pwdOptions.canGenerateRandomPassword ?? false;
    //     field.inputs['passwordStrength'] = pwdOptions.passwordStrength ?? new PasswordStrength();
    //     field.inputs['autocomplete'] = pwdOptions.autocomplete ?? 'new-password';
    //     return make(field, options);
    // }

    // if (input === 'file') {
    //     const fileOptions = options as any;
    //     field.inputs['minAllowedFiles'] = fileOptions.minAllowedFiles;
    //     field.inputs['maxAllowedFiles'] = fileOptions.maxAllowedFiles;
    //     field.inputs['path'] = fileOptions.path || field.path || field.name;
    //     field.inputs['accept'] = fileOptions.accept || '*.*';
    //     field.inputs['view'] = fileOptions.view || 'list';
    //     field.inputs['fileSelector'] = fileOptions.fileSelector || 'system';
    //     field.inputs['color'] = fileOptions.color || 'accent';
    //     field.inputs['dateFormat'] = fileOptions.dateFormat || 'dd MMM yyyy';
    //     field.inputs['includeAccess'] = fileOptions.includeAccess || false;
    //     field.inputs['minSize'] = fileOptions.minSize || 0;
    //     field.inputs['maxSize'] = fileOptions.maxSize || 1024 * 1024 * 10;
    //     return make(field, options);
    // }
    // if (input === 'html') {
    //     const htmlOptions = options as any;
    //     field.inputs['uploadPath'] = htmlOptions.path || field.path || field.name;
    //     return make(field, options);
    // }

    return field;
}
