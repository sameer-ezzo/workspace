import { PasswordStrength } from "@upupa/auth";
import { Field, Validator } from "../types";
import { DataAdapterDescriptor } from "@upupa/data";

export interface IDynamicFormFieldOptions {}
export class TextFieldOptions {}
export class NumberFieldOptions {}
export class BooleanFieldOptions {}
export class AdapterFieldOptions {
    minAllowed?: number = 1;
    maxAllowed?: number = 1;
    adapter: DataAdapterDescriptor = { type: "client", data: [] };
}

export type BaseFormFieldOptions = Field & {
    required?: boolean;
    group?: string;
};
export type VisibleFormFieldOptions = BaseFormFieldOptions & {
    name?: string;
    label?: string;
    placeholder?: string;
    floatLabel: "auto" | "always" | "never";
    text?: string;
    hint?: string;
    appearance?: "fill" | "outline";
    disabled?: boolean;
    readonly?: boolean;
    hidden?: boolean;

    localize?: boolean;
    order?: number;
};
export type FileInputOptions = {
    includeAccess?: boolean;
    base?: string;
    path?: string;
    color?: "primary" | "accent" | "warn";
    dateFormat?: string;
    minAllowedFiles?: number;
    maxAllowedFiles?: number;
    minSize?: number;
    maxSize?: number;
    accept?: string;
    view?: "list" | "grid";
    fileSelector?: "browser" | "system";
};
export type ChoicesFieldOptions = VisibleFormFieldOptions &
    AdapterFieldOptions & {
        direction?: "horizontal" | "vertical";
        template?: "normal" | "thumbs";
        thumbSize?: number;
        renderer?: "markdown" | "html" | "none";
    };

export type TableInputOptions = {
    options: {
        listViewModel: any;
        rowActions: [];
        headerActions: [];
    };
};
export type FieldOptions =
    | ({ input: "hidden" } & BaseFormFieldOptions)
    | (VisibleFormFieldOptions &
          (
              | ({ input: "fieldset" } & BaseFormFieldOptions)
              | ({ input: "object" } & BaseFormFieldOptions)
              | ({ input: "text" } & TextFieldOptions)
              | ({ input: "textarea" } & TextFieldOptions & {
                        rows?: number;
                        maxRows?: number;
                    })
              | ({ input: "phone" } & TextFieldOptions)
              | ({ input: "password" } & TextFieldOptions & {
                        showConfirmPasswordInput?: boolean;
                        showPassword?: boolean;
                        canGenerateRandomPassword?: boolean;
                        passwordStrength?: PasswordStrength;
                        autocomplete?: "current-password" | "new-password";
                    })
              | ({ input: "number" } & NumberFieldOptions)
              | ({ input: "switch" } & BooleanFieldOptions & {
                        template?: "checkbox" | "toggle";
                        renderer?: "markdown" | "html" | "none";
                    })
              | ({ input: "checks" } & ChoicesFieldOptions)
              | ({ input: "radios" } & ChoicesFieldOptions)
              | ({ input: "select" } & AdapterFieldOptions)
              | { input: "date" }
              | ({ input: "file" } & FileInputOptions)
              | ({ input: "html" } & {
                    uploadPath: string;
                    editorType: "decoupled" | "classic";
                })
              | ({ input: "array" } & TableInputOptions)
              | ({ input: "chips" } & {
                    parentPath?: string;
                    visible?: boolean;
                    selectable?: boolean;
                    removable?: boolean;
                    separatorKeysCodes?: string[];
                })
          ));
export type FieldInputType = FieldOptions["input"];
