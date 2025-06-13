import { PasswordStrength } from "@noah-ark/common";
import { Field, formInput, formScheme, FormScheme, hiddenField, switchField } from "@upupa/dynamic-form";
import { ɵ$localize } from "@angular/localize";

export const defaultVerifyCodeField: FormScheme = {
    code: {
        input: "text",
        inputs: { label: "Code", placeholder: "Enter the 6-digit code" },
        validations: [
            { name: "required" },
            { name: "length", arguments: 6, message: "Code must be 6 digits" },
            {
                name: "pattern",
                arguments: /^[0-9]*$/,
                message: "Code must be 6 digits",
            },
        ],
    } as Field,
};

@formScheme()
export class LoginWithUsernameFormViewModel {
    @formInput({ input: "text", label: $localize`Username`, placeholder: $localize`Use a valid username` })
    username = "";
    @formInput({
        input: "password",
        label: $localize`Password`,
        placeholder: $localize`Use a valid password`,
        passwordStrength: new PasswordStrength(),
        showConfirmPasswordInput: false,
    })
    password = "";
    @formInput({ input: "switch", label: $localize`Remember Me` })
    rememberMe = true;
}

@formScheme()
export class LoginWithEmailFormViewModel {
    @formInput({ input: "email", label: $localize`Email`, placeholder: $localize`Use a valid email` })
    email = "";
    @formInput({
        input: "password",
        label: $localize`Password`,
        placeholder: $localize`Use a valid password`,
        passwordStrength: new PasswordStrength(),
        showConfirmPasswordInput: false,
    })
    password = "";
    @formInput({ input: "switch", label: $localize`Remember Me` })
    rememberMe = true;
}
export const defaultEmailField: Field = {
    input: "email",
    inputs: { label: $localize`Email`, placeholder: $localize`Use a valid email` },
    validations: [{ name: "required" }, { name: "email" }],
};

export const usernameLoginFormFields: FormScheme = {
    username: { input: "text", inputs: { label: $localize`Username`, placeholder: $localize`Use a valid username` }, validations: [{ name: "required" }] },
    password: {
        input: "text",
        inputs: {
            label: $localize`Password`,
            type: "password",
            placeholder: $localize`Password`,
            PasswordStrength: null,
        },
        validations: [{ name: "required" }],
    },
    rememberMe: switchField("rememberMe", $localize`Remember Me`),
};

export const defaultLoginFormFields: FormScheme = {
    email: defaultEmailField,
    password: {
        input: "text",
        inputs: {
            label: $localize`Password`,
            type: "password",
            placeholder: $localize`Password`,
            PasswordStrength: null,
        },
        validations: [{ name: "required" }],
    },
    rememberMe: switchField("rememberMe", $localize`Remember Me`),
};

export const defaultForgotPasswordFormFields: FormScheme = {
    email: defaultEmailField,
};

export const defaultResetPasswordFormFields: FormScheme = {
    reset_token: hiddenField("reset_token"),
    email: defaultEmailField,
};

export const defaultVerifyFormFields: FormScheme = {
    token: {
        input: "hidden",
        validations: [{ name: "required" }],
    },
};

export const userFullNameField: Field = {
    input: "text",
    inputs: { label: "Full Name", placeholder: "Ex: John Doe" },
};

export const userNameField: Field = {
    input: "text",
    inputs: { label: "Username", placeholder: "Ex: x_man" },
    validations: [
        { name: "required" },
        { name: "minLength", arguments: 3 },
        { name: "maxLength", arguments: 30 },
        {
            name: "latin",
            arguments: /^[a-zA-Z0-9_.@-]*$/,
            message: "Only latin characters, numbers, period, @ symbol and underscore are allowed",
        },
    ],
};

export const passwordField = {
    input: "password",
    name: "password",

    autocomplete: "new-password",
    canGenerateRandomPassword: true,
    showConfirmPasswordInput: true,
    validations: [{ name: "required" }],
} as Field;

export const defaultSignupFormFields: FormScheme = {
    email: defaultEmailField,
    password: passwordField,
};
