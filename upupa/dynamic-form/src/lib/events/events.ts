import { Field } from "../types";

export interface DynamicFormMessage {
    fields: string | string[];
    targetFormName?: string
}

export namespace DynamicFormCommands {
    export const changeVisibility = "DF.visibility";
    export class ChangeVisibility implements DynamicFormMessage {
        constructor(public fields: string[], public visibility: boolean, public targetFormName?: string) { }
        msg: typeof changeVisibility = changeVisibility;
    }

    export const changeFormScheme = "DF.changeFormScheme";
    export class ChangeFormScheme implements DynamicFormMessage {
        constructor(public fields: string, public newField?: Partial<Field>, public targetFormName?: string) { }
        msg: typeof changeFormScheme = changeFormScheme;
    }

    export const changeInputs = "DF.changeInputs";
    export class ChangeInputs implements DynamicFormMessage {
        constructor(public fields: string, public inputs: any, public targetFormName?: string) { }
        msg: typeof changeInputs = changeInputs;
    }

    export const changeValue = "DF.value";
    export class ChangeValue implements DynamicFormMessage {
        constructor(public fields: string, public value: any, public targetFormName?: string) { }
        msg: typeof changeValue = changeValue;
    }

    export const changeState = "DF.state";
    export class ChangeState implements DynamicFormMessage {
        constructor(public fields: string[], public state: { disabled?: boolean; dirty?: boolean; touched?: boolean }, public targetFormName?: string) { }
        msg: typeof changeState = changeState;
    }


    export const addErrorMessage = "DF.+error";
    export class AddErrorMessage implements DynamicFormMessage {
        constructor(public fields: string[], public error: any, public targetFormName?: string) { }
        msg: typeof addErrorMessage = addErrorMessage;
    }


    export const removeErrorMessage = "DF.-error";
    export class RemoveErrorMessage implements DynamicFormMessage {
        constructor(public fields: string[], public error: any, public targetFormName?: string) { }
        msg: typeof removeErrorMessage = removeErrorMessage;
    }


    export const addWarningMessage = "DF.+warning";
    export class AddWarningMessage implements DynamicFormMessage {
        constructor(public fields: string[], public warning: any, public targetFormName?: string) { }
        msg: typeof addWarningMessage = addWarningMessage;
    }


    export const removeWarningMessage = "DF.-warning";
    export class RemoveWarningMessage implements DynamicFormMessage {
        constructor(public fields: string[], public warning: any, public targetFormName?: string) { }
        msg: typeof removeWarningMessage = removeWarningMessage;
    }


    export type AnyCommands =
        ChangeVisibility |
        ChangeValue |
        ChangeState |
        AddErrorMessage |
        RemoveErrorMessage |
        AddWarningMessage |
        RemoveWarningMessage |
        ChangeFormScheme |
        ChangeInputs
}

export namespace DynamicFormEvents {

    export const valueChanged = "DF.value-changed";
    export class ValueChanged implements DynamicFormMessage {
        constructor(public fields: string, public value: any) { }
        msg: typeof valueChanged = valueChanged;
    }

    export type AnyEvent = ValueChanged
}