import { Condition } from "@noah-ark/expression-engine";
import { ActionDescriptor } from "@upupa/common";
import { Field, FormScheme } from "@upupa/dynamic-form";
import { ColumnsDescriptor } from "@upupa/table";
import { defaultEmailField, userFullNameField, userNameField } from "../default-values";

export const defaultRolesListHeaderActions: ActionDescriptor[] = [{ variant: "stroked", header: true, name: "create", icon: "person_add", text: "Create", color: "primary" }];
export const defaultRolesListActions: ActionDescriptor[] = [
    { variant: "icon", name: "edit", icon: "edit" },
    { variant: "icon", name: "delete", icon: "delete", color: "warn" },
];

export const defaultUserListHeaderActions: ActionDescriptor[] = [
    { path: "auth", action: "Ban User", variant: "button", text: "Ban user", name: "ban", icon: "block", bulk: true, header: true, color: "warn" },
    { path: "auth", action: "Admin Create User", variant: "stroked", header: true, name: "create", icon: "person_add", text: "Create", color: "primary" },
];

export const defaultCreateUserFromScheme: FormScheme = {
    email: defaultEmailField,
    username: userNameField,
    name: userFullNameField,
    password: {
        input: "password",
        name: "password",
        required: true,
        label: "Password",
    } as Field,
    forceChangePwd: {
        input: "switch",
        name: "forceChangePwd",
        inputs: {
            template: "checkbox",
            label: "Force change password",
        },
    } as Field,
};


export const defaultRolesListColumns: ColumnsDescriptor = {
    _id: { header: "Role Id" },
    name: { header: "Role Name" },
};

export type FormOptions = Partial<Record<"signup" | "createUser" | "editUser" | "createRole" | "editRole", { scheme: FormScheme; conditions?: Condition[] }>>;
export type ListOptions = Partial<{
    users: any;
    roles: any;
}>;

export const defaultUsersManagementOptions = {
    forms: {
        createUser: { scheme: defaultCreateUserFromScheme },
        // editUser: { scheme: defaultEditUserFromScheme },
    },
    lists: {
        // users: {
        //     // columns: defaultUserListColumns,
        //     rowActions: defaultUserListActions,
        //     headerActions: defaultUserListHeaderActions,
        // },
        roles: {
            columns: defaultRolesListColumns,
            rowActions: defaultRolesListActions,
            headerActions: defaultRolesListHeaderActions,
        },
    },
} as UsersManagementOptions;

export class UsersManagementOptions {
    constructor(
        public forms?: FormOptions,
        public lists?: ListOptions,
    ) {
        this.forms = { ...defaultUsersManagementOptions.forms, ...forms };
        this.lists = { ...defaultUsersManagementOptions.lists, ...lists };
    }
}
