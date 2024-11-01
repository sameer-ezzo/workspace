import { FieldItem, FormScheme, switchField } from '@upupa/dynamic-form';

export const defaultVerifyCodeField: FormScheme = {
    code: {
        type: 'field',
        input: 'text',
        ui: {
            inputs: { label: 'Code', placeholder: 'Enter the 6-digit code' },
        },
        validations: [
            { name: 'required' },
            { name: 'length', arguments: 6, message: 'Code must be 6 digits' },
            {
                name: 'pattern',
                arguments: /^[0-9]*$/,
                message: 'Code must be 6 digits',
            },
        ],
    } as FieldItem,
};

export const defaultEmailField: FieldItem = {
    type: 'field',
    input: 'email',
    ui: { inputs: { label: 'Email', placeholder: 'Use a valid email' } },
    validations: [{ name: 'required' }, { name: 'email' }],
};

export const defaultLoginFormFields: FormScheme = {
    email: defaultEmailField,
    password: {
        type: 'field',
        input: 'text',
        ui: {
            inputs: {
                label: 'Password',
                type: 'password',
                placeholder: 'Password',
                PasswordStrength: null,
            },
        },
        validations: [{ name: 'required' }],
    },
    rememberMe: switchField('rememberMe', 'Remember Me'),
};

export const defaultForgotPasswordFormFields: FormScheme = {
    email: defaultEmailField,
};

export const defaultVerifyFormFields: FormScheme = {
    token: {
        type: 'field',
        input: 'hidden',
        ui: { validations: [{ name: 'required' }] },
    },
};

export const userFullNameField: FieldItem = {
    type: 'field',
    input: 'text',
    ui: {
        inputs: { label: 'Full Name', placeholder: 'Ex: John Doe' },
    },
};

export const userNameField: FieldItem = {
    type: 'field',
    input: 'text',
    ui: { inputs: { label: 'Username', placeholder: 'Ex: x_man' } },
    validations: [
        { name: 'required' },
        { name: 'minLength', arguments: 3 },
        { name: 'maxLength', arguments: 30 },
        {
            name: 'latin',
            arguments: /^[a-zA-Z0-9_.@-]*$/,
            message: 'Only latin characters, numbers, period, @ symbol and underscore are allowed',
        },
    ],
};

export const passwordField = {
    type: 'field',
    input: 'password',
    name: 'password',

    autocomplete: 'new-password',
    canGenerateRandomPassword: true,
    showConfirmPasswordInput: true,
    validations: [{ name: 'required' }],
} as FieldItem;

export const defaultSignupFormFields: FormScheme = {
    email: defaultEmailField,
    password: passwordField,
};
