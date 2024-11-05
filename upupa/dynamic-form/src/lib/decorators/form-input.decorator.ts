// make a property decorator that creates a FormFieldItem from a property
// export * from './lib/decorators/form-field.decorator';
import "reflect-metadata";
import { Field, Fieldset } from "../types";
import { ActionDescriptor, toTitleCase } from "@upupa/common";
import { PasswordStrength } from "@upupa/auth";
import { DynamicFormInputs } from "../dynamic-form-inputs";
import { DynamicFormFieldInputType, FormFieldOptions, VisibleFormFieldOptions } from "./decorators.types";
import { getLanguageInfo } from "@upupa/language";
import { DataAdapterDescriptor } from "@upupa/data";
import { Class } from "@noah-ark/common";
import { cloneDeep } from "lodash";

const formSchemeMetadataKey = Symbol("custom:form_scheme_options");

export type DynamicFormOptionsMetaData = DynamicFormOptions & {
    fields: Record<
        string,
        {
            options: Partial<FormFieldOptions>;
            localize: boolean | undefined;
            target: any;
        }
    >;
    onSubmitAction?: Omit<ActionDescriptor, "name"> & {
        name: "onSubmit";
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
export type DynamicFormOptions<T = any> = Omit<DynamicFormInputs<T>, "fields"> & {
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
        opts.name = (opts.name ?? target.name).trim().toLowerCase().replace(/\//g, "-");

        // append translations fieldset to the end of the form fields
        // const translations = opts.fields['translations'];
        // if (translations) {
        //     delete opts.fields['translations'];
        //     opts.fields['translations'] = translations;
        // }

        setDynamicFormOptionsMetadataFor(target, opts);
    };
}
export function submitAction(action?: Partial<Omit<ActionDescriptor, "name">>) {
    return function (target: any, propertyKey: string) {
        const inputs = resolveDynamicFormOptionsFor(target.constructor) ?? ({} as DynamicFormOptionsMetaData);

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
        fieldOpts["localize"] = true;
        formInput(fieldOpts)(target, propertyKey);
    };
}
function guessFieldInputType(target, propertyKey, options): string {
    let input = options["input"];
    if (input) return input;
    // get the type of the property
    const type = Reflect.getMetadata("design:type", target, propertyKey);
    if (type === Number) return "number";
    else if (type === Boolean) return "switch";
    else if (type === Array) return "select";
    else if (type === Date) return "date";
    else if (type === Object) return "fieldset";
    else if (typeof type === "function") return "fieldset";
    else return "text";
}

export function formInput(options: Pick<FormFieldOptions, "input"> & Partial<FormFieldOptions> = { input: "text" }) {
    return function (target: any, propertyKey: string) {
        const opts = resolveDynamicFormOptionsFor(target.constructor);
        opts.fields ??= {};
        const localize = options["localize"];
        delete options["localize"];
        opts.fields[propertyKey] = { options, localize, target };
        setDynamicFormOptionsMetadataFor(target.constructor, opts);
    };
}

export type FormViewModelMirror = {
    viewModelType: Class;
} & DynamicFormInputs &
    Pick<DynamicFormOptionsMetaData, "actions" | "onSubmitAction">;

export function reflectFormViewModelType(viewModel: Class): FormViewModelMirror {
    const formOptions = resolveDynamicFormOptionsFor(viewModel);
    const inputs = {
        conditions: formOptions.conditions,
        name: formOptions.name ?? viewModel.name,
        preventDirtyUnload: formOptions.preventDirtyUnload,
        recaptcha: formOptions.recaptcha,
        theme: formOptions.theme,
        actions: formOptions.actions,
        onSubmitAction: formOptions.onSubmitAction,
    };

    const fields = new Map<string, Field>();
    buildFormScheme(formOptions as Pick<DynamicFormOptionsMetaData, "fields" | "locales">, fields);

    return { viewModelType: viewModel, ...inputs, fields };
}

function sortFields(fields: [string, { options: Partial<FormFieldOptions>; localize: boolean; target: any }][]) {
    return fields.sort((a, b) => a[1].options["order"] - b[1].options["order"]);
}

function sortFieldsByOrder(fields: DynamicFormOptionsMetaData["fields"]) {
    const entries = Object.entries(fields);
    const orderedEntries = sortFields(entries.filter(([k, v]) => v.options["order"] !== undefined));
    const minOrder = orderedEntries[0]?.[1]["options"]["order"] ?? 0;
    for (let idx = 0; idx < entries.length; idx++) {
        const [key, fieldInfo] = entries[idx];
        if (fieldInfo.options["order"] === undefined) {
            fieldInfo.options["order"] = minOrder + idx;
        }
    }
    return sortFields(entries);
}
function buildFormScheme(info: Pick<DynamicFormOptionsMetaData, "fields" | "locales">, parentFormScheme: Map<string, Field>): void {
    const { fields, locales } = info;
    const fieldNamesSorted = sortFieldsByOrder(fields);

    for (const [key, fieldInfo] of fieldNamesSorted) {
        const { options, localize, target } = fieldInfo;
        const input = guessFieldInputType(target, key, options);
        //todo: introduce array field type instead of using fieldset

        if (input === "fieldset" || input === "array") makeFieldset(key, options, target, localize, locales, parentFormScheme);
        else makeFieldItem(key, options, target, localize, locales, parentFormScheme);
    }

    const translationsFieldset = parentFormScheme.get("translations");
    parentFormScheme.delete("translations");
    if (translationsFieldset && Object.keys(translationsFieldset)) parentFormScheme.set("translations", translationsFieldset);
}

function makeFormFieldOptions(fieldName: string, options: Partial<FormFieldOptions>) {
    const opts = options ?? {};
    const label = opts["label"] ?? toTitleCase(fieldName);

    const inputs = {
        required: opts["required"] === true,
        text: opts["text"],
        hidden: opts["hidden"] === true,
        label,
        placeholder: opts["placeholder"],
        appearance: opts["appearance"],
        fieldName,
        hint: opts["hint"],
        ...(opts["inputs"] || {}),
    } as VisibleFormFieldOptions;

    if (opts["floatLabel"] && !inputs.floatLabel) inputs.floatLabel = opts["floatLabel"];
    if ("readonly" in inputs) inputs["readonly"] = inputs["readonly"] === true;
    if ("disabled" in inputs) inputs["disabled"] = inputs["disabled"] === true;

    return {
        name: fieldName,
        validations: options["validations"] || [],
        ui: { inputs },
    } as unknown as Field;
}

function makeFieldItem(
    fieldName: string,
    options: Partial<FormFieldOptions>,
    target: any,
    localize: boolean,
    locales: DynamicFormOptionsMetaData["locales"],
    parentFormScheme: Map<string, Field>,
) {
    const fieldBase = makeFormFieldOptions(fieldName, options);
    const input = guessFieldInputType(target, fieldName, options);

    const field = fillFieldInputs(fieldName, fieldBase, input as any, options);
    if (localize) _localizeField(fieldName, field, locales, parentFormScheme, options);
    parentFormScheme[fieldName] = field;
}

function makeFieldset(
    name: string,
    options: Partial<FormFieldOptions>,
    target: any,
    localize: boolean,
    locales: DynamicFormOptionsMetaData["locales"],
    parentFormScheme: Map<string, Field>,
) {
    const fieldset = { ...makeFormFieldOptions(name, options), type: "fieldset", items: new Map<string, Field>() } as Fieldset;

    const propType = options.input?.["viewModel"] ?? Reflect.getMetadata("design:type", target, name);
    const mirror: FormViewModelMirror = typeof propType === "function" ? reflectFormViewModelType(propType) : ({} as FormViewModelMirror);
    fieldset.items = mirror.fields;
    parentFormScheme.set(name, fieldset);
}

const makeTranslationFieldset = (name, label): Fieldset => {
    return {
        type: "fieldset",
        input: "fieldset",
        items: {},
        ui: {
            inputs: {
                label,
            },
        },
    } as Fieldset;
};

const _localizeField = (
    name: string,
    field: Field,
    locales: DynamicFormOptionsMetaData["locales"],
    parentFormScheme: Map<string, Field>,
    options: Partial<FormFieldOptions>,
): void => {
    if (field.type === "fieldset") return;

    if (!locales) return;
    const defaultLocale = (locales.defaultLocale ?? "").trim();
    const translations = (locales.translations ?? []).filter((x) => (x ?? "").trim());
    if (!defaultLocale.length || !translations.length) return;

    parentFormScheme["translations"] ??= makeTranslationFieldset("translations", "Translations");
    const translationFieldset = parentFormScheme["translations"] as Fieldset;

    for (const locale of translations) {
        let localeFieldset = (translationFieldset.items[locale] as Fieldset) ?? makeTranslationFieldset(locale, getLanguageInfo(locale).nativeName);
        const translationField = cloneDeep(field);
        localeFieldset.items[name] = translationField;
        translationFieldset.items[locale] = localeFieldset;
    }
};

function fixAdapterOptions(field: Field, options: Partial<FormFieldOptions>) {
    if (options["adapter"]) {
        const descriptor: DataAdapterDescriptor = options["adapter"] ?? { type: "client", data: [] };
        field.ui.inputs["_adapter"] = descriptor;
        delete field.ui.inputs["adapter"];
        field.ui.inputs["minAllowed"] = options["minAllowed"];
        field.ui.inputs["maxAllowed"] = options["maxAllowed"];
    }
}
function fillFieldInputs(name: string, base: Field, input: DynamicFormFieldInputType, options: Partial<FormFieldOptions>): Field {
    const field = {
        ...base,
        input,
    } as Field;
    field.type = input === "fieldset" ? "fieldset" : "field";

    fixAdapterOptions(field, options);
    switch (input) {
        case "select":
            break;
        case "array":
            // todo: implement array field
            break;
        case "checks":
        case "radios":
            const choicesOptions = options as any;
            field.ui.inputs["direction"] = choicesOptions.direction ?? "vertical";
            field.ui.inputs["template"] = choicesOptions.template ?? "normal";
            field.ui.inputs["thumbSize"] = choicesOptions.thumbSize ?? 50;
            field.ui.inputs["renderer"] = choicesOptions.renderer ?? "none";
            break;
        case "fieldset":
            const fieldsetOptions = options as any;
            field.ui.inputs["label"] = fieldsetOptions.label ?? field.ui.inputs["label"];
            break;

        case "switch":
            const switchOptions = options as any;
            field.ui.inputs["template"] = switchOptions.template ?? "toggle";
            field.ui.inputs["renderer"] = switchOptions.renderer ?? "none";
            break;
        case "password":
            const pwdOptions = options as any;
            field.ui.inputs["showConfirmPasswordInput"] = pwdOptions.showConfirmPasswordInput ?? false;
            field.ui.inputs["showPassword"] = pwdOptions.showPassword ?? false;
            field.ui.inputs["canGenerateRandomPassword"] = pwdOptions.canGenerateRandomPassword ?? false;
            field.ui.inputs["passwordStrength"] = pwdOptions.passwordStrength ?? new PasswordStrength();
            field.ui.inputs["autocomplete"] = pwdOptions.autocomplete ?? "new-password";
            break;
        case "file":
            const fileOptions = options as any;
            field.ui.inputs["minAllowedFiles"] = fileOptions.minAllowedFiles;
            field.ui.inputs["maxAllowedFiles"] = fileOptions.maxAllowedFiles;
            field.ui.inputs["path"] = fileOptions.path || name;
            field.ui.inputs["accept"] = fileOptions.accept || "*.*";
            field.ui.inputs["view"] = fileOptions.view || "list";
            field.ui.inputs["fileSelector"] = fileOptions.fileSelector || "system";
            field.ui.inputs["color"] = fileOptions.color || "accent";
            field.ui.inputs["dateFormat"] = fileOptions.dateFormat || "dd MMM yyyy";
            field.ui.inputs["includeAccess"] = fileOptions.includeAccess || false;
            field.ui.inputs["minSize"] = fileOptions.minSize || 0;
            field.ui.inputs["maxSize"] = fileOptions.maxSize || 1024 * 1024 * 10;
            break;
        case "html":
            const htmlOptions = options as any;
            field.ui.inputs["uploadPath"] = htmlOptions.uploadPath || name;
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
            field.ui.inputs["rows"] = options["rows"];
            field.ui.inputs["maxRows"] = options["maxRows"];
            field.ui.inputs["minSize"] = options["minSize"];

            break;

        default:
            fixAdapterOptions(field, options);
            field.ui.inputs = { ...field.ui.inputs, ...options };
    }

    // return make(field, options);

    // if (input.length === 0) field.input = 'hidden';

    // if (input === 'hidden') return make(field, options);

    // if (input === 'switch') {
    //     const switchOptions = options as any;
    //     field.ui.inputs['template'] = switchOptions.template ?? 'toggle';
    //     field.ui.inputs['renderer'] = switchOptions.renderer ?? 'none';
    // }
    // if (input === 'password') {
    //     const pwdOptions = options as any;
    //     field.ui.inputs['showConfirmPasswordInput'] = pwdOptions.showConfirmPasswordInput ?? false;
    //     field.ui.inputs['showPassword'] = pwdOptions.showPassword ?? false;
    //     field.ui.inputs['canGenerateRandomPassword'] = pwdOptions.canGenerateRandomPassword ?? false;
    //     field.ui.inputs['passwordStrength'] = pwdOptions.passwordStrength ?? new PasswordStrength();
    //     field.ui.inputs['autocomplete'] = pwdOptions.autocomplete ?? 'new-password';
    //     return make(field, options);
    // }

    // if (input === 'file') {
    //     const fileOptions = options as any;
    //     field.ui.inputs['minAllowedFiles'] = fileOptions.minAllowedFiles;
    //     field.ui.inputs['maxAllowedFiles'] = fileOptions.maxAllowedFiles;
    //     field.ui.inputs['path'] = fileOptions.path || field.path || field.name;
    //     field.ui.inputs['accept'] = fileOptions.accept || '*.*';
    //     field.ui.inputs['view'] = fileOptions.view || 'list';
    //     field.ui.inputs['fileSelector'] = fileOptions.fileSelector || 'system';
    //     field.ui.inputs['color'] = fileOptions.color || 'accent';
    //     field.ui.inputs['dateFormat'] = fileOptions.dateFormat || 'dd MMM yyyy';
    //     field.ui.inputs['includeAccess'] = fileOptions.includeAccess || false;
    //     field.ui.inputs['minSize'] = fileOptions.minSize || 0;
    //     field.ui.inputs['maxSize'] = fileOptions.maxSize || 1024 * 1024 * 10;
    //     return make(field, options);
    // }
    // if (input === 'html') {
    //     const htmlOptions = options as any;
    //     field.ui.inputs['uploadPath'] = htmlOptions.path || field.path || field.name;
    //     return make(field, options);
    // }

    return field;
}
