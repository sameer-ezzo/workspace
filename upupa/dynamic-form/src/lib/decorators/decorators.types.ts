import { PasswordStrength } from "@upupa/auth";
import { Field } from "../types";
import { DataAdapterDescriptor } from "@upupa/data";
import { Class } from "@noah-ark/common";
import { FormViewModelMirror } from "./form-input.decorator";

export class TextFieldOptions {}
export class NumberFieldOptions {}
export class BooleanFieldOptions {}
export class AdapterFieldOptions {
    minAllowed?: number = 1;
    maxAllowed?: number = 1;
    adapter: DataAdapterDescriptor = { type: "client", data: [] };
}
export type FieldGroup = { name: string; template?: string; class?: string; inputs?: Record<string, any> };
export type BaseFormFieldOptions = Field & {
    required?: boolean;
    group?: string | FieldGroup;
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
              | ({ input: "paragraph" } & { text: string; renderer: "markdown" | "html" | "none" })
              | ({ input: "text" } & TextFieldOptions)
              | ({ input: "color" } & TextFieldOptions)
              | ({ input: "textarea" } & TextFieldOptions & {
                        rows?: number;
                        maxRows?: number;
                    })
              | ({ input: "phone" } & TextFieldOptions)
              | ({ input: "email" } & TextFieldOptions)
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
              | { input: "time" }
              | { input: "calendar" }
              | ({ input: "file" } & FileInputOptions)
              | ({ input: "html" } & {
                    uploadPath: string;
                    editorType: "decoupled" | "classic";
                })
              | ({ input: "array" } & TableInputOptions)
              | ({ input: "table" } & TableInputOptions)
              | ({ input: "chips" } & AdapterFieldOptions & {
                        parentPath?: string;
                        visible?: boolean;
                        selectable?: boolean;
                        removable?: boolean;
                        separatorKeysCodes?: string[];
                    })
              | ({ input: "group" } & BaseFormFieldOptions)
              | ({ input: "form" } & BaseFormFieldOptions & { viewModel: Class | FormViewModelMirror })
          ));
