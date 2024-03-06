import { SimplePermission, SimplePermissionRecord } from "./simple-permission";

export type AccessType = "grant" | "deny";
export type AuthorizeResult = {
    rule?: { name: string; path: string };
    action: string;
    source: "default" | "condition" | string;
    access: AccessType;
};



export type PermissionBase = {
    /**
     * @description if permission is stored in db then this is the id of the permission
     */
    _id?: string;

    /**
     * @example a staff user cannot delete an asset
     */
    name?: string;



    /**
     * @description if the permission is builtin
     */
    builtIn?: boolean;



    access: AccessType | undefined
};

export type PermissionRecord = {
    rule: string;
    action: string;
}

/**
 * @description
 * Permission object groups the logic of actions of a rule
 */
export type Permission<
    T extends boolean | AuthorizeFun = boolean | AuthorizeFun
> = T extends AuthorizeFun ? FunctionalPermission<T> : (SimplePermission | SimplePermissionRecord);

/**
 * @description
 * This permission is used to define a permission that is a function per action, where the function is evaluated to access type (grant, deny)
 */
export type FunctionalPermission<T extends AuthorizeFun = AuthorizeFun> =
    PermissionBase & { actions: { [name: string]: T } };

export type AuthorizeFun = (ctx: any) => AccessType;
