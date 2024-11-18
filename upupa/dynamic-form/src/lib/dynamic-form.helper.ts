import { Field } from "./types";
export function mergeFields(target: Partial<Field>, source: Partial<Field>) {
    const getValidations = (f: Pick<Field, "validations">) => (f.validations ? f.validations.map((v) => ({ ...v })) : []);
    const validations = [...getValidations(source), ...getValidations(target)];

    const result: Field = {
        input: target.input ?? source.input, //copy string
        class: target.class ?? source.class, //copy string
        inputs: { ...source.inputs, ...target.inputs }, //spread and copy simple types and assign same refrence for complex types (ex: adapter)
        hidden: target.hidden ?? source.hidden,
        validations,
    };

    return result;
}

export function _mergeFields(target: Partial<Field>, source: Partial<Field>): void {
    target.input = target.input ?? source.input;
    target.class = target.class ?? source.class;
    target.inputs = { ...source.inputs, ...target.inputs };
    target.outputs = { ...source.outputs, ...target.outputs };
    target.hidden = target.hidden ?? source.hidden;
    target.validations = [...(target.validations?.map((v) => Object.assign({}, v)) ?? []), ...(source.validations?.map((v) => Object.assign({}, v)) ?? [])];
}
