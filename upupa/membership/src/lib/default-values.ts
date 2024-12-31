import { PasswordStrength } from "@upupa/auth";
import { Field, formInput, formScheme, FormScheme, hiddenField, switchField } from "@upupa/dynamic-form";

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
export class LoginFormViewModel {
    @formInput({ input: "email" })
    email = "";
    @formInput({ input: "password", passwordStrength: new PasswordStrength(), showConfirmPasswordInput: false })
    password = "";
    @formInput({ input: "switch" })
    rememberMe = true;
}
export const defaultEmailField: Field = {
    input: "email",
    inputs: { label: "Email", placeholder: "Use a valid email" },
    validations: [{ name: "required" }, { name: "email" }],
};

export const defaultLoginFormFields: FormScheme = {
    email: defaultEmailField,
    password: {
        input: "text",
        inputs: {
            label: "Password",
            type: "password",
            placeholder: "Password",
            PasswordStrength: null,
        },
        validations: [{ name: "required" }],
    },
    rememberMe: switchField("rememberMe", "Remember Me"),
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
