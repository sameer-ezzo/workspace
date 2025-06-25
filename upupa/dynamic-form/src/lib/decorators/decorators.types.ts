import { Field, FormScheme } from "../types";
import { DataAdapter, DataAdapterDescriptor } from "@upupa/data";
import { Class, PasswordStrength } from "@noah-ark/common";
import { FormViewModelMirror } from "./form-input.decorator";
import { ComponentInputs, ComponentOutputsHandlers, DynamicComponent } from "@upupa/common";
import type { MatChipsComponent } from "@upupa/dynamic-form-material-theme";

export class TextFieldOptions {}
export class NumberFieldOptions {}
export class BooleanFieldOptions {}
export class AdapterFieldOptions {
    multiple?: boolean = false;
    showSearch?: boolean = false;
    adapter: DataAdapterDescriptor | DataAdapter = { type: "client", data: [] };
}
export type FieldGroup = { name: string; template?: string; class?: string; inputs?: Record<string, any>; hidden?: boolean };
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
    capture?: string;
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
              | ({ input: "fieldset" | "object" } & BaseFormFieldOptions & { items: FormScheme })
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
              | ({ input: "autocomplete" } & AdapterFieldOptions)
              | ({ input: "list" } & AdapterFieldOptions & { viewModel: Class; tableHeaderComponent?: DynamicComponent }) // this is used to render table with selection capability (like select input but with table view)
              | { input: "date" }
              | { input: "date-range" }
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
                    } & { outputs?: ComponentOutputsHandlers<MatChipsComponent>; inputs?: Partial<ComponentInputs<MatChipsComponent>> })
              | ({ input: "group" } & BaseFormFieldOptions)
              | ({ input: "form" } & BaseFormFieldOptions & { viewModel: Class | FormViewModelMirror })
          ));
