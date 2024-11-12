// decorators => viewModelDefinition => mapping > form scheme

import { Type } from "@angular/core"
import { formInput, formScheme, reflectFormViewModelType, Validator } from "@upupa/dynamic-form"


export function FormViewModel(
    attributes?: {
        name?: string
        class?: string
        id?: string
    }) {
    // fill metadata with general form info (name)
    return (target) => {
        formScheme(attributes as any)
    }
}

// type FormViewModelDefinition = { // almost like form scheme
//     name: string
//     fields: {}
// }

export function extractFormScheme(viewModel: Type<any>) {
    //read reflect metadata
    // map to viewModelDefinition
    const dynamicFormInputs = reflectFormViewModelType(viewModel as any)
    return {
        formAttributes: {
            name: dynamicFormInputs.name,
        },
        fields: dynamicFormInputs.fields
    }
}







@FormViewModel()
export class ContactFormViewModel { // implements FormViewModelChanges

    // @FormInput()
    email = "ijiu"




    // @FormAction('submit','people')
    // submit() {

    // }



    // formViewModelChanges($context) {

    //     const currentValue = $context
    //     const previusVluae = $context
    //     const fieldName = $context

    //     const scheme = $context
    //     if(previusVluae > 0) {
    //         scheme[fieldName].visible = false
    //     }
    // }
}

export type FormInputAttributes = {

    input: string
    label?: string
    required?: boolean
    placeholder?: string
    hint?: string
    text?: string
    disabled?: boolean
    readonly?: boolean
    validations?: Validator[]
    appearance?: "fill" | "outline"


    customComponentInputs?: Record<string, any>
    visibility?: "visible" | "collapse" | "hidden" | "none"

}

// export type TextInputAttributes = FormInputAttributes & { input: "text" }
// export type SelectInputAttributes = FormInputAttributes & { adapter: SimpleDataAdapter }

function FormInput<T extends FormInputAttributes>(inputAttributes: T): (target: Type<any>, propertyKey: string) => void {
    const options = {
        ...inputAttributes,

        visibility: undefined,
        hidden: inputAttributes.visibility && inputAttributes.visibility !== "visible",

        customComponentInputs: undefined,
        inputs: inputAttributes.customComponentInputs
    }

    return formInput(options as any);
}

export function FormTextInput(inputAttributes: FormInputAttributes) {
    return FormInput({
        input: 'text',
        ...inputAttributes
    });
}

function FormNumberInput(inputAttributes: FormInputAttributes) {
    return FormInput({
        input: 'number',
        ...inputAttributes
    });
}

function FormDateInput(inputAttributes: FormInputAttributes) {
    return FormInput({
        input: 'date',
        ...inputAttributes
    });
}

function FormSwitchInput(inputAttributes: FormInputAttributes) {
    return FormInput({
        input: 'switch',
        ...inputAttributes
    });
}

function FormPasswordInput(inputAttributes: FormInputAttributes) {
    return FormInput({
        input: 'password',
        ...inputAttributes
    });
}

function FormRadioInput(inputAttributes: FormInputAttributes) {
    return FormInput({
        input: 'radio',
        ...inputAttributes
    });
}

function FormSelectInput(inputAttributes: FormInputAttributes) {
    return FormInput({
        input: 'select',
        ...inputAttributes,
    });
}