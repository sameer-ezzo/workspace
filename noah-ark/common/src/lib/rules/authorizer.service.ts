import { JsonPointer } from "@noah-ark/json-patch"
import { Principle } from "../user"
import { AccessType, AuthorizeResult, isPermissionSimple, Permission, permissionKey } from "./permission"
import { _NullPermissionTypes, _StringPermissionTypes, isObjectValuePermission, SimplePermission } from "./simple-permission"
import { evaluateOpExpression } from "@noah-ark/expression-engine"

export type AuthorizeMessage = { payload: any, operation: string, path: string, query: any, ctx?: any, principle: Principle }
export class AuthorizerService {

    /**
     *
     * @param msg The message object to be authorized (it contains the path to the rule object and it contains the principle object)
     * @param action A string key that points to the specific permission inside the rule object @default rule.operation
     * @param additional Any data useful for the authorization function @example { new_data, old_data }
     * @returns grant or deny access for the provided msg/action
     */
    authorize(msg: AuthorizeMessage, rule: any, action?: string, additional?: Record<string, unknown>): AuthorizeResult {
        //BUILD CONTEXT AND ALLOW SUPER ADMIN
        action ??= msg.operation
        if (this._isSuperAdmin(msg)) return { rule: { name: 'builtin:super-admin', path: '**' }, action, source: 'default', access: 'grant' }

        // const rule = this.rulesService.getRule(msg.path, true)! // use default app rule
        const ruleSummary = rule ? { name: rule.name, path: rule.path, fallbackSource: rule.fallbackSource, ruleSource: rule.ruleSource } : undefined

        //ASSUME THE RESULT IS THE DEFAULT AUTHORIZATION

        //AUTHORIZE BY PERMISSION (GET PERMISSIONS THAT HAS THE ANSWER FOR THIS ACTION)
        let access: AccessType = typeof rule.fallbackAuthorization === 'string' ? rule.fallbackAuthorization : 'deny'
        let source = 'rule-fallback'
        let permissions = rule.actions?.[action] ?? []
        if (permissions.length === 0) {
            if (Array.isArray(rule.fallbackAuthorization)) {
                // logger.warn(`Falling back to parent rule permissions. Parent rule: ${rule.name}`)
                permissions = rule.fallbackAuthorization
            }
        }

        if (!permissions.length) return { rule: ruleSummary, action, source, access }

        const accessResults = permissions.map(p => ({
            result: this._evalPermission(p, { msg, additional }),
            permission: p
        }))

        //FALLBACK TO DEFAULT AUTHORIZATION
        if (accessResults.every(r => r.result == undefined)) return { rule: ruleSummary, action, source, access }

        //CHECK PERMISSIONS DENY
        const denyingPermissions = accessResults.filter(r => r.result === false)
        if (denyingPermissions.length) {
            source = denyingPermissions.map(r => permissionKey(r.permission)).join(';')
            access = 'deny'
        }

        //CHECK PERMISSIONS GRANT
        const grantingPermissions = accessResults.filter(r => r.result === true)
        if (grantingPermissions.length) {
            source = grantingPermissions.map(r => permissionKey(r.permission)).join(';')
            access = 'grant'
        }

        return { rule: ruleSummary, action, source, access }
    }

    private _evalPermission(p: Permission, ctx?: { msg: AuthorizeMessage, additional?: Record<string, unknown> }): boolean | undefined {
        // if (!action || !p?.action) return undefined

        if (isPermissionSimple(p)) {
            const permission = p as SimplePermission
            const access = permission.access === 'grant'
            const isNullPermission = _NullPermissionTypes.includes(p.by as any)
            if (isNullPermission && p.by === 'anonymous') return access

            if (!ctx) return undefined
            const principle = ctx.msg?.principle

            if (isNullPermission) {
                if (p.by === 'user') return principle ? access : undefined;
                if (p.by === 'emv') return principle?.emv ? access : undefined;
                if (p.by === 'phv') return principle?.phv ? access : undefined;
            }
            if ('value' in p && _StringPermissionTypes.includes(p.by as any)) {
                const value = (p.value as string || '').toLocaleLowerCase()
                if (p.by === 'role') return principle?.roles?.some(r => r === value) ? access : undefined
                if (p.by === 'email') return principle?.email?.toLocaleLowerCase() === value ? access : undefined
                if (p.by === 'phone') return principle?.phone?.toLocaleLowerCase() === value ? access : undefined
            }
            if (isObjectValuePermission(p)) {
                if (p.by === 'claim') {
                    //TODO: evaluate claimObject by its operator and value
                    const claimObject = p.value
                    const value = JsonPointer.get(principle?.claims, claimObject.claimFieldPath)
                    return value === claimObject.claimValue ? access : undefined;
                }
            }
            return access;
        }
        else { //functional permission
            const r = evaluateOpExpression(p, ctx)
            return r === 'grant'
        }
    }


    private _isSuperAdmin(ctx: AuthorizeMessage) {
        const principle = ctx.principle!;
        return principle && principle.roles?.some((r: string) => r === 'super-admin' || r === 'developer');
    }
}