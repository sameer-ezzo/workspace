
import { AccessType, PermissionBase, PermissionRecord } from "./permission"


/**
 * @description Array of simple permission types that does not require a value
 */
export const _NullPermissionTypes = ['anonymous', 'user', 'emv', 'phv'] as const //user -> authinticated

/**
 * @description Array of simple permission types that does require a string value
 */
export const _StringPermissionTypes = ['role', 'email', 'phone'] as const

/**
 * @description Array of simple permission types that does require a string value
 */
export const _ObjectPermissionTypes = ['claim'] as const

/**
 * @description Array of simple permission types
 */
export const SimplePermissionTypes = [..._NullPermissionTypes, ..._StringPermissionTypes, ..._ObjectPermissionTypes] as const
/**
 * @enum
 * anonymous: if the user is not logged in
 * user: if the user is logged in
 * role: if the user has a role specified in value
 * claim: if the user has a claim specified in value object
 * emv: if the user has an email verified
 * phv: if the user has a phone verified
 * email: if the user matches an email pattern specified in value
 * phone: if the user matches a phone pattern specified in value
 * ip: if the user matches a phone pattern specified in value
 */
export type SimplePermissionType = typeof SimplePermissionTypes[number]

export type NullValuePermission = { by: typeof _NullPermissionTypes[number] }
export type StringValuePermission = {
    by: typeof _StringPermissionTypes[number]
    value: string
}
export type ObjectValuePermission = {
    by: typeof _ObjectPermissionTypes[number]
    value: {
        claimFieldPath: string
        claimValue: string
        operator?: string
    }
}


export type SimplePermissionBase = NullValuePermission | StringValuePermission | ObjectValuePermission

export type SimplePermission = PermissionBase & SimplePermissionBase
export type SimplePermissionRecord = SimplePermission & PermissionRecord

export class Permissions {
    static anonymous(access: AccessType = 'grant'): SimplePermission { return { by: 'anonymous', access } }
    static visitor(access: AccessType = 'grant'): SimplePermission { return { by: 'anonymous', access } }
    static authenticated(access: AccessType = 'grant'): SimplePermission { return { by: 'user', access } }

    static role(role: string, access: AccessType = 'grant'): SimplePermission { return { by: 'role', value: role, access } }
    static email(email: string, access: AccessType = 'grant'): SimplePermission { return { by: 'email', value: email, access } }
}

export function isObjectValuePermission(p: Partial<SimplePermission>): p is ObjectValuePermission {
    return 'by' in p && _ObjectPermissionTypes.includes(p.by as any)
}