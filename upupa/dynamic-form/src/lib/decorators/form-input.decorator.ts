// make a property decorator that creates a FormField from a property
// export * from './lib/decorators/form-field.decorator';
import "reflect-metadata";
import { Field, Fieldset, FormScheme } from "../types";
import { ActionDescriptor, DynamicComponent, toTitleCase } from "@upupa/common";
import { PasswordStrength } from "@upupa/auth";
import { DynamicFormInputs } from "../dynamic-form-inputs";
import { FieldGroup, FieldOptions } from "./decorators.types";
import { DataAdapterDescriptor } from "@upupa/data";
import { Class } from "@noah-ark/common";
import { TableHeaderComponent } from "@upupa/table";

const FORM_METADATA_KEY = Symbol("custom:form_scheme_options");

function reflectFormMetadata(targetClass: Class): DynamicFormOptionsMetaData {
    // const parent = targetClass.prototype ? Object.getPrototypeOf(targetClass.prototype)?.constructor : null;

    const options = createFormMetadata();
    // if (parent && parent.constructor) Object.assign(options, reflectFormMetadata(parent));

    return Object.assign(options, Reflect.getMetadata(FORM_METADATA_KEY, targetClass) ?? {});
}

function defineFormMetadata(targetClass: any, value: DynamicFormOptionsMetaData) {
    let targetOptions = reflectFormMetadata(targetClass);
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
    groups: Record<string, FieldGroup>;

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

export function formInput(opt?: Partial<FieldOptions>, group?: FieldGroup) {
    return (property: any, propertyKey: string) => {
        const formMetadata = reflectFormMetadata(property.constructor) ?? createFormMetadata();

        opt ??= {};
        opt.input ??= inferFieldInputType(property, propertyKey, opt);
        const f = fillFieldInputs(propertyKey, opt);

        formMetadata.fields[propertyKey] = f;
        formMetadata.targets[propertyKey] = property;
        if (opt.group) formMetadata.groups[propertyKey] = typeof opt.group === "string" ? { name: opt.group, template: "div" } : opt.group;

        defineFormMetadata(property.constructor, formMetadata);

        if (group) {
            inputGroup(group)(property, propertyKey);
        }
    };
}

export function inputGroup(group: FieldGroup) {
    return (target: any, propertyKey: string) => {
        const metadata = reflectFormMetadata(target.constructor) ?? createFormMetadata();
        metadata.groups[propertyKey] = group;
        defineFormMetadata(target.constructor, metadata);
    };
}

export type DynamicFormOptions<T = any> = Omit<DynamicFormInputs<T>, "fields"> & {
    locales?: { defaultLocale: string; translations: { key: string; label: string }[] };
};

export function formScheme(options?: DynamicFormOptions) {
    return function (target: any) {
        const formOptions = reflectFormMetadata(target) ?? createFormMetadata();
        const opts = {
            ...formOptions,
            ...options,
        };
        opts.name = opts.name ?? target.name;
        defineFormMetadata(target, opts);
    };
}

export function formAction(action: Partial<ActionDescriptor> & { order?: number }) {
    return function (property: any, propertyKey: string) {
        const formMetadata = reflectFormMetadata(property.constructor) ?? createFormMetadata();
        formMetadata.actions ??= [];

        const _action = {
            ...action,
            name: action.name || propertyKey,
            handlerName: propertyKey,
            order: action.order ?? formMetadata.actions.length,
            type: (action.type ?? propertyKey == "onSubmit") ? "submit" : "button",
        };
        formMetadata.actions.push(_action as any);
        defineFormMetadata(property.constructor, formMetadata);
    };
}

export type FormViewModelMirror = {
    viewModelType: Class;
} & DynamicFormInputs &
    Pick<DynamicFormOptionsMetaData, "actions">;

export function reflectFormViewModelType(viewModel: Class): FormViewModelMirror {
    const formMetadata = reflectFormMetadata(viewModel) ?? createFormMetadata();
    const inputs = {
        conditions: formMetadata.conditions,
        name: formMetadata.name ?? viewModel.name,
        preventDirtyUnload: formMetadata.preventDirtyUnload,
        recaptcha: formMetadata.recaptcha,
        theme: formMetadata.theme,
        actions: formMetadata.actions,
    };

    const fields = {} as FormScheme;

    const _currentFields = Object.entries(formMetadata.fields);
    while (_currentFields.length) {
        const [fieldName, field] = _currentFields.shift();
        const groupName = formMetadata.groups[fieldName]?.name;
        if (groupName || field.input === "group") {
            const group = (fields[groupName] as Fieldset) ?? {
                input: "group",
                items: {},
                inputs: { label: toTitleCase(groupName), ...formMetadata.groups[fieldName].inputs },
                template: formMetadata.groups[fieldName].template,
                class: formMetadata.groups[fieldName].class,
            };

            group.items[fieldName] = field;
            fields[groupName] = group;
        } else if (field.input === "object" || field.input === "fieldset") {
            let items = field["items"];
            const target = formMetadata.targets[fieldName];
            if (target) {
                const type = Reflect.getMetadata("design:type", target, fieldName);
                const childMirror = reflectFormViewModelType(type);
                items = childMirror.fields;
            }
            fields[fieldName] = { ...field, input: "object", items };
        } else {
            fields[fieldName] = field;
        }
    }

    return { viewModelType: viewModel, ...inputs, fields };
}

export function formInputArray(
    tableViewModel: Class,
    config: { inlineEndSlot?: DynamicComponent[]; showSearch?: boolean } = { inlineEndSlot: [], showSearch: false },
    options?: Partial<FieldOptions>,
) {
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
    field.inputs["hint"] = fieldOptions["hint"] ?? field.inputs["hint"];
    field.inputs["placeholder"] = fieldOptions["placeholder"] ?? field.inputs["placeholder"];

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
