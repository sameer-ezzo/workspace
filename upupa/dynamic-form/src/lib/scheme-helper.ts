import { languagesList } from "@upupa/language";
import { ClientDataSource, DataAdapter } from "@upupa/data";

import { FieldItem, Validator } from "./types";

export type Appearance = "fill" | "outline";
function field(
    input: string,
    name: string,
    label: string = name,
    placeholder?: string,
    hint?: string,
    appearance?: Appearance,
    validators: Validator[] = [],
    hidden = false,
): FieldItem {
    const indexOfRequired: number = validators?.findIndex((v) => v.name === "required") ?? -1;
    if (indexOfRequired > -1) validators.splice(indexOfRequired, 1);

    const f = {
        input: input,
        name: name,
        validations: validators,
        placeholder: placeholder,
        inputs: {
            required: indexOfRequired > -1,
            label: label,
            placeholder: placeholder,
            appearance: appearance || "outline",
            hint: hint,
        },
        hidden,
    } as FieldItem;
    return f;
}

export function hiddenField(name: string) {
    const hf = field("hidden", name, "");
    return hf;
}

export function phoneField(name: string, label: string = name, placeholder?: string, hint?: string, appearance?: "fill" | "outline", validators: Validator[] = [], hidden = false) {
    validators ??= [{ name: "email" }];
    const tf = field("phone", name, label, placeholder, hint, appearance, validators, hidden);
    return tf;
}
export function emailField(name: string, label: string = name, placeholder?: string, hint?: string, appearance?: "fill" | "outline", validators: Validator[] = [], hidden = false) {
    validators ??= [{ name: "email" }];
    const tf = field("text", name, label, placeholder, hint, appearance, validators, hidden);
    return tf;
}

export function textField(name: string, label: string = name, placeholder?: string, hint?: string, appearance?: "fill" | "outline", validators: Validator[] = [], hidden = false) {
    const tf = field("text", name, label, placeholder, hint, appearance, validators, hidden);
    return tf;
}

// languageField('language','Language', undefined, undefined, 'outline', ['en', 'ar'], 'ar')
export function languageField(
    name: string,
    label: string = name,
    placeholder?: string,
    hint?: string,
    appearance?: "fill" | "outline",
    filter?: string[],
    validators: Validator[] = [],
    hidden = false,
) {
    const tf = field("select", name, label, placeholder, hint, appearance, validators, hidden);

    if (!filter || filter.length < 2) filter = Object.keys(languagesList);
    const languagesDs = new ClientDataSource(
        filter.map((k) => {
            return { code: k, ...languagesList[k] };
        }),
    );
    let terms = [];
    if (languagesDs.all?.length > 10) {
        terms = [
            { field: "code", type: "like" },
            { field: "nativeName", type: "like" },
            { field: "name", type: "like" },
        ];
    }
    const languagesAdapter = new DataAdapter(languagesDs, "code", "nativeName", undefined, undefined, {
        terms,
    });

    tf.inputs["adapter"] = languagesAdapter;
    return tf;
}
export function textAreaField(
    name: string,
    label: string = name,
    placeholder?: string,
    hint?: string,
    appearance?: "fill" | "outline",
    minRows?: number,
    maxRows?: number,
    validators: Validator[] = [],
    hidden = false,
) {
    minRows = minRows || 3;
    maxRows = maxRows || minRows + 3;
    const ta = field("textarea", name, label, placeholder, hint, appearance, validators, hidden);
    ta.inputs["rows"] = minRows;
    ta.inputs["maxRows"] = maxRows;
    return ta;
}

export function numberField(
    name: string,
    label: string = name,
    placeholder?: string,
    hint?: string,
    appearance?: "fill" | "outline",
    validators: Validator[] = [],
    hidden = false,
) {
    const nf = field("number", name, label, placeholder, hint, appearance, validators, hidden);
    return nf;
}

export function selectField(
    name: string,
    label: string = name,
    adapter: DataAdapter,
    placeholder?: string,
    hint?: string,
    appearance?: "fill" | "outline",
    maxAllowed?: number,
    validators: Validator[] = [],
    hidden = false,
): FieldItem {
    const sf = field("select", name, label, placeholder, hint, appearance, validators, hidden);
    sf.inputs["adapter"] = adapter;
    sf.inputs["maxAllowed"] = maxAllowed;
    return sf;
}

export function autoCompleteField(
    name: string,
    label: string = name,
    adapter: DataAdapter,
    placeholder?: string,
    hint?: string,
    appearance?: "fill" | "outline",
    maxAllowed?: number,
    validators: Validator[] = [],
    hidden = false,
) {
    const sf = field("autocomplete-text", name, label, placeholder, hint, appearance, validators, hidden);
    sf.inputs["adapter"] = adapter;
    sf.inputs["maxAllowed"] = maxAllowed;
    return sf;
}

export function dateField(name: string, label: string = name, placeholder?: string, hint?: string, appearance?: "fill" | "outline", validators: Validator[] = [], hidden = false) {
    const df = field("date", name, label, placeholder, hint, appearance, validators, hidden);
    return df;
}

export function fileField(
    name: string,
    label: string = name,
    path: string,
    placeholder?: string,
    hint?: string,
    minAllowedFiles = 0,
    maxAllowedFiles = 1,
    showExplorer: boolean = true,
    accept?: string,
    view?: "grid" | "list",
    validators: Validator[] = [],
    hidden = false,
) {
    const ff = field("file", name, label, placeholder, hint, null, validators, hidden);
    ff.inputs["minAllowedFiles"] = minAllowedFiles;
    ff.inputs["maxAllowedFiles"] = maxAllowedFiles;
    ff.inputs["path"] = path ?? "/";
    ff.inputs["accept"] = accept ?? "*.*";
    ff.inputs["view"] = view ?? "grid";
    return ff;
}

export function htmlField(name: string, label: string = name, uploadPath?: string, placeholder?: string, hint?: string, validators: Validator[] = [], hidden = false) {
    const hf = field("html", name, label, placeholder, hint, null, validators, hidden);
    hf.inputs["uploadPath"] = uploadPath ?? `/${name}`;
    return hf;
}

export function checkboxField(name: string, label: string = name, hint?: string, validators: Validator[] = [], hidden = false) {
    const hf = field("switch", name, label, label, hint, null, validators, hidden);
    hf.inputs["template"] = "checkbox";
    return hf;
}
export function switchField(name: string, label: string = name, hint?: string, validators: Validator[] = [], hidden = false) {
    const hf = field("switch", name, label, label, hint, null, validators, hidden);
    hf.inputs["template"] = "toggle";

    return hf;
}

export function checksField(
    name: string,
    label: string = name,
    adapter: DataAdapter,
    placeholder?: string,
    hint?: string,
    appearance?: "fill" | "outline",
    validators: Validator[] = [],
    hidden = false,
): FieldItem {
    const sf = field("checks", name, label, placeholder, hint, appearance, validators, hidden);
    sf.inputs["adapter"] = adapter;
    return sf;
}

export function radiosField(
    name: string,
    label: string = name,
    adapter: DataAdapter,
    placeholder?: string,
    hint?: string,
    appearance?: "fill" | "outline",
    validators: Validator[] = [],
    hidden = false,
): FieldItem {
    const sf = field("radios", name, label, placeholder, hint, appearance, validators, hidden);
    sf.inputs["adapter"] = adapter;
    return sf;
}
