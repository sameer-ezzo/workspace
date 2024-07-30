import { IncomingMessage } from "../message";
import { Principle } from "../user";
import { SimplePermission, _NullPermissionTypes, _StringPermissionTypes, isObjectValuePermission } from "./simple-permission";

export type AuthorizeMessage = { payload: any, operation: string, path: string, query: any, ctx?: any, principle: Principle }
export type PermissionSelectorsEvaluationContext = {
    result?: AccessType,
    permission: Permission<boolean | AuthorizeFun>,
    match: { evaluated?: Omit<AuthorizeMessage, 'principle'>, result: boolean }
}
export type AuthorizeContext = {
    msg: AuthorizeMessage,
    additional?: Record<string, unknown>,
    permissions?: Record<string, PermissionSelectorsEvaluationContext>
}

export type AccessType = "grant" | "deny";
export type AuthorizeResult = {
    rule?: { name: string; path: string };
    action: string;
    source?: Permission
    access: AccessType;
    ctx?: AuthorizeContext;
};



export type PermissionBase = {
    /**
     * @description if permission is stored in db then this is the id of the permission
     */
    _id?: string;

    /**
        * @description if permission is stored in db then this is the id of the permission
        */
    rule?: string;
    /**
        * @description if permission is stored in db then this is the id of the permission
        */
    action?: string

    /**
     * @example a staff user cannot delete an asset
     */
    name?: string;



    /**
     * @description if the permission is builtin
     */
    builtIn?: boolean;

    valueType?: 'role' | 'email' | 'phone' | 'claim' | 'ip' | 'anonymous' | 'user' | 'emv' | 'phv' | 'custom';

    selectors?: Partial<Omit<IncomingMessage, 'principle'>>;
    access: AccessType
};


/**
 * @description
 * Permission object groups the logic of actions of a rule
 */
export type Permission<T extends boolean | AuthorizeFun = boolean> =
    T extends AuthorizeFun ? FunctionalPermission : SimplePermission;

export type AuthorizeFun = (ctx: AuthorizeContext, permission: SimplePermission) => boolean;
/**
 * @description
 * This permission is used to define a permission that is a function per action, where the function is evaluated to access type (grant, deny)
 */
export type FunctionalPermission = PermissionBase & {
    authorize: AuthorizeFun
};

export function isPermissionSimple(p: Permission<boolean | AuthorizeFun>): p is SimplePermission {
    return 'by' in p
}

export function permissionKey(p: Permission<boolean | AuthorizeFun>) {
    if (p.name) return p.name
    if (isPermissionSimple(p)) {
        if (_NullPermissionTypes.includes(p.by as any)) return `${p.access}:${p.by}`
        if ('value' in p && _StringPermissionTypes.includes(p.by as any)) return `${p.access}:${p.by}:${p.value}`
        if (isObjectValuePermission(p)) return `${p.access}:${p.by}:${p.value.claimFieldPath}${p.value.operator ?? '='}${p.value.claimValue}`
    }
    return '<function>'
}