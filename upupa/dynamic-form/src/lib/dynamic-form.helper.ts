import { Field, FieldItem } from "./types";
export function mergeFields(target: Partial<FieldItem>, source: Partial<FieldItem>) {
    const getValidations = (f: Pick<FieldItem, 'validations'>) => (f.validations ? f.validations.map(v => ({ ...v })) : [])
    const validations = [...getValidations(source), ...getValidations(target)]

    const reuslt: Field = {
        input: target.input ?? source.input, //copy string
        name: target.name ?? source.name, //copy string
        type: target.type ?? source.type, //copy string
        ui: {
            class: target.ui?.class ?? source.ui?.class, //copy string
            id: target.ui?.id ?? source.ui?.id, //copy string
            style: target.ui?.style ?? source.ui?.style, //copy string
            inputs: { ...source.ui?.inputs, ...target.ui?.inputs }, //spread and copy simple types and assign same refrence for complex types (ex: adapter)
            hidden: target.ui?.hidden ?? source.ui?.hidden
        },
        validationTask: target.validationTask ?? source.validationTask, //assign refrence
        validations
    }


    return reuslt;

}

export function _mergeFields(target: Partial<FieldItem>, source: Partial<FieldItem>): void {

    target.input = target.input ?? source.input;
    target.name = target.name ?? source.name;
    target.type = target.type ?? source.type;
    target.ui = {
        class: target.ui?.class ?? source.ui?.class, //copy string
        id: target.ui?.id ?? source.ui?.id, //copy string
        style: target.ui?.style ?? source.ui?.style, //copy string
        inputs: { ...source.ui?.inputs, ...target.ui?.inputs }, //spread and copy simple types and assign same refrence for complex types (ex: adapter)
        hidden: target.ui?.hidden ?? source.ui?.hidden
    };
    target.validationTask = target.validationTask ?? source.validationTask;
    target.validations = [...(target.validations?.map(v => Object.assign({}, v)) ?? []),
    ...(source.validations?.map(v => Object.assign({}, v)) ?? [])
    ]

}
