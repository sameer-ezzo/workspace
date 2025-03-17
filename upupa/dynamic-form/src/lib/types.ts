
import { Type } from "@angular/core";
import { DynamicComponent } from "@upupa/common";

export type FieldItem<TCom = any> = {
    /**
     * @description input type inspired by html, it can be a string for any custom component or an INPUT_TYPE.
     * @example text, select, number, textarea
     */
    input: string | FieldInputType;

    /** @description Optional. The text associated with the field */
    text?: string;

    /** @description Optional. Array of validators for the field */
    validations?: Validator[];

    //UI

    class?: string;
    inputs?: DynamicComponent<TCom>["inputs"];
    outputs?: DynamicComponent<TCom>["outputs"];
    hidden?: boolean;
};

const INPUTS = [
    "hidden",
    "recaptcha",
    "text",
    "textarea",
    "paragraph",
    "color",
    "autocomplete",
    "number",
    "number",
    "date",
    "phone",
    "color",
    "password",
    "slider",
    "reviews",
    "email",
    "select",
    "array",
    "radios",
    "checks",
    "chips",
    "file",
    "local",
    "tree",
    "switch",
    "address",
] as const;
export type FieldInputType = (typeof INPUTS)[number];

export const SET_INPUTS = ["object", "array", "group"] as const;
export type FieldGroupType = (typeof SET_INPUTS)[number];

export type Fieldset = FieldItem & {
    input: FieldGroupType;
    items: FormScheme;
};

export type Field = FieldItem | Fieldset;

export type FormScheme = Map<string, Field> | { [name: string]: Field };

export type ComponentInputs = { [name: string]: any };
export type DynamicComponentMapping = {
    component: Type<any>;
    field?: Partial<Field>;
};
export class DynamicComponentMapper {
    [type: string]: DynamicComponentMapping;
}

export type ValidatorName =
    | "required"
    | "requiredTrue"
    | "latin"
    | "email"
    | "includes"
    | "startsWith"
    | "endsWith"
    | "maxLength"
    | "minLength"
    | "length"
    | "pattern"
    | "regex"
    | "max"
    | "min"
    | "greaterThan"
    | "lessThan"
    | "before"
    | "after"
    | "timeSpanMax"
    | "timeSpanMin";
export type RequiredValidator = { name: "required" | "requiredTrue"; arguments?: boolean; message?: string };
export type EmailValidator = { name: "email"; arguments?: RegExp; message?: string };
export type LatinValidator = { name: "latin"; arguments?: RegExp; message?: string };
export type IncludesValidator = { name: "includes"; arguments: string; message?: string };
export type StartsWithValidator = { name: "startsWith"; arguments: string; message?: string };
export type EndsWithValidator = { name: "endsWith"; arguments: string; message?: string };

export type LengthValidator = { name: "length"; arguments: number; message?: string };
export type MaxLengthValidator = { name: "maxLength"; arguments: number; message?: string };
export type MinLengthValidator = { name: "minLength"; arguments: number; message?: string };

export type PatternValidator = { name: "pattern"; arguments: RegExp; message?: string };

export type MaxValidator = { name: "max"; arguments: number; message?: string };
export type MinValidator = { name: "min"; arguments: number; message?: string };
export type GreaterThanValidator = { name: "greaterThan"; arguments: number; message?: string };
export type LessThanValidator = { name: "lessThan"; arguments: number; message?: string };

export type Validator =
    | RequiredValidator
    | EmailValidator
    | LatinValidator
    | IncludesValidator
    | StartsWithValidator
    | EndsWithValidator
    | LengthValidator
    | MaxLengthValidator
    | MinLengthValidator
    | PatternValidator
    | MaxValidator
    | MinValidator
    | GreaterThanValidator
    | LessThanValidator;
