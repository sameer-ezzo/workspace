

import { DatePipe } from "@angular/common";
import { Condition } from "@noah-ark/expression-engine";
import { ActionDescriptor } from "@upupa/common";
import { FieldItem, FormScheme } from "@upupa/dynamic-form";
import { ColumnsDescriptor } from "@upupa/table";
import { defaultEmailField, userFullNameField, userNameField } from "../default-values";

export const defaultRolesListHeaderActions: ActionDescriptor[] = [
    { variant: 'stroked', header: true, name: 'create', icon: 'person_add', text: 'Create', color: 'primary' },
]
export const defaultRolesListActions: ActionDescriptor[] = [
    { variant: 'icon', name: 'edit', icon: 'edit' },
    { variant: 'icon', name: 'delete', icon: 'delete', color: 'warn' }

]
export const defaultUserListActions: ActionDescriptor[] = [
    { variant: 'button', text: 'Ban user', name: 'ban', icon: 'block', menu: true, color: 'warn' },
    { variant: 'icon', name: 'edit', icon: 'edit' },
    { path: '/auth/impersonate', variant: 'icon', name: 'impersonate', icon: 'supervised_user_circle' },
    { path: '/auth/resetpassword', variant: 'icon', text: 'Reset password', name: 'reset', icon: 'password', menu: true },
    { path: '/auth/updateusertoroles', variant: 'icon', text: 'Change roles', name: 'change-user-roles', icon: 'switch_access_shortcut_add', menu: true },
    { variant: 'icon', text: 'Delete User', name: 'delete', icon: 'delete', color: 'warn', menu: true }
];
export const defaultUserListHeaderActions: ActionDescriptor[] = [
    { path: '/auth/ban', variant: 'button', text: 'Ban user', name: 'ban', icon: 'block', bulk: true, header: true, color: 'warn' },
    { path: 'auth/admincreate', variant: 'stroked', position: 'header', name: 'create', icon: 'person_add', text: 'Create', color: 'primary' }
];

export const defaultCreateUserFromScheme: FormScheme = {
    email: defaultEmailField,
    username: userNameField,
    name: userFullNameField,
    password: {
        input: 'text',
        name: 'password',
        type: 'field',
        validations: [{ name: 'required' }],
        ui: { inputs: { label: 'Password' } }
    } as FieldItem,
    forceChangePwd: {
        input: 'switch',
        name: 'forceChangePwd',
        type: 'field',
        ui: {
            inputs: {
                template: 'checkbox',
                renderer: 'none',
                label: 'Force change password'
            }
        }
    } as FieldItem,
};

export const defaultEditUserFromScheme: FormScheme = {
    email: defaultEmailField,
    name: userFullNameField
};

export const defaultUserListColumns: ColumnsDescriptor = {
    name: { header: 'Full name' },
    email: { header: 'Email' },
    roles: { header: 'User Roles', sortDisabled: true },
    lastLogin: { header: 'Last Sign in', pipe: { pipe: DatePipe, args: ['medium'] } }
};

export const defaultRolesListColumns: ColumnsDescriptor = {
    _id: { header: 'Role Id' },
    name: { header: 'Role Name' },
}

export type FormOptions = Partial<Record<'signup' | 'createUser' | 'editUser' | 'createRole' | 'editRole', { scheme: FormScheme, conditions?: Condition[] }>>
export type ListOptions = Partial<{
    'users': any
    'roles': any
}>

export const defaultUsersManagementOptions = {
    forms: {
        createUser: { scheme: defaultCreateUserFromScheme },
        editUser: { scheme: defaultEditUserFromScheme }
    },
    lists: {
        'users': {
            columns: defaultUserListColumns,
            rowActions: defaultUserListActions,
            headerActions: defaultUserListHeaderActions
        },
        'roles': {
            columns: defaultRolesListColumns,
            rowActions: defaultRolesListActions,
            headerActions: defaultRolesListHeaderActions,
        }
    }
} as UsersManagementOptions



export class UsersManagementOptions {
    constructor(public forms?: FormOptions, public lists?: ListOptions) {
        this.forms = { ...defaultUsersManagementOptions.forms, ...forms }
        this.lists = { ...defaultUsersManagementOptions.lists, ...lists }
    }
}