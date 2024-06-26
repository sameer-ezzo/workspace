

import { DatePipe } from "@angular/common";
import { Condition } from "@noah-ark/expression-engine";
import { ActionDescriptor } from "@upupa/common";
import { FieldItem, FormScheme } from "@upupa/dynamic-form";
import { ColumnsDescriptor } from "@upupa/table";
import { defaultEmailField, userFullNameField, userNameField } from "../default-values";
import { TagsPipe } from "@upupa/tags";

export const defaultRolesListActions: ActionDescriptor[] = [
    { variant: 'stroked', header: true, action: 'create', icon: 'person_add', text: 'Create', color: 'primary' },
    { variant: 'icon', action: 'edit', icon: 'edit' },
    { variant: 'icon', action: 'delete', icon: 'delete', color: 'warn' }

]
export const defaultUserListActions: ActionDescriptor[] = [
    { variant: 'button', text: 'Ban user', action: 'ban', icon: 'block', bulk: true, header: true, color: 'warn' },
    { variant: 'stroked', position: 'header', action: 'create', icon: 'person_add', text: 'Create', color: 'primary' },

    { variant: 'button', text: 'Ban user', action: 'ban', icon: 'block', menu: true, color: 'warn' },
    { variant: 'icon', action: 'edit', icon: 'edit' },
    { variant: 'icon', action: 'impersonate', icon: 'supervised_user_circle' },
    { variant: 'icon', text: 'Reset password', action: 'reset', icon: 'password', menu: true },
    { variant: 'icon', text: 'Change roles', action: 'change-user-roles', icon: 'switch_access_shortcut_add', menu: true },
    { variant: 'icon', text: 'Delete User', action: 'delete', icon: 'delete', color: 'warn', menu: true }
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
type ListOptionsValue = { columns: ColumnsDescriptor }
export type ListOptions = Partial<{
    'users': ListOptionsValue & { actions: ActionDescriptor[] | ((item: any) => ActionDescriptor[]) },
    'roles': ListOptionsValue & { actions: ActionDescriptor[] }
}>

export const defaultUsersManagementOptions = {
    forms: {
        createUser: { scheme: defaultCreateUserFromScheme },
        editUser: { scheme: defaultEditUserFromScheme }
    },
    lists: {
        'users': { columns: defaultUserListColumns, actions: defaultUserListActions },
        'roles': { columns: defaultRolesListColumns, actions: defaultRolesListActions }
    }
} as UsersManagementOptions



export class UsersManagementOptions {
    constructor(public forms?: FormOptions, public lists?: ListOptions) {
        this.forms = { ...defaultUsersManagementOptions.forms, ...forms }
        this.lists = { ...defaultUsersManagementOptions.lists, ...lists }
    }
}