import { Injectable } from "@nestjs/common";
import { AuthorizeResult, IncomingMessage, Permission,permissionKey, PrincipleBase, SimplePermission, _NullPermissionTypes, _ObjectPermissionTypes, _StringPermissionTypes, isObjectValuePermission, isPermissionSimple } from '@noah-ark/common';
import { evaluateOpExpression } from "@noah-ark/expression-engine";
import { JsonPointer } from "@noah-ark/json-patch";
import { RulesService } from "./rules.svr";



@Injectable()
export class AuthorizeService {

    constructor(public readonly rulesService: RulesService) { }

    /**
     *
     * @param msg The message object to be authorized (it contains the path to the rule object and it contains the principle object)
     * @param action A string key that points to the specific permission inside the rule object @default rule.operation
     * @param additional Any data useful for the authorization function @example { new_data, old_data }
     * @returns grant or deny access for the provided msg/action
     */
    authorize(msg: IncomingMessage, action?: string, additional?: Record<string, unknown>): AuthorizeResult {
        //BUILD CONTEXT AND ALLOW SUPER ADMIN
        action ??= msg.operation ?? '*'
        if (this._isSuperAdmin(msg)) return { rule: { name: 'builtin:super-admin', path: '**' }, action, source: 'default', access: 'grant' }

        const rule = this.rulesService.getRule(msg.path, true)! // use default app rule
        const ruleSummary = rule ? { name: rule.name, path: rule.path, fallbackSource: rule.fallbackSource, ruleSource: rule.ruleSource } : undefined

        //ASSUME THE RESULT IS THE DEFAULT AUTHORIZATION
        let access = rule.fallbackAuthorization
        let source = 'rule-fallback'

        //AUTHORIZE BY PERMISSION (GET PERMISSIONS THAT HAS THE ANSWER FOR THIS ACTION)
        const permissions = (rule.actions?.[action] ?? rule.actions?.['*'] ?? [])
        const accessResults = permissions.map(p => ({
            result: this._evalPermission(p, action, { msg, additional }),
            permission: p
        }))

        //FALLBACK TO DEFAULT AUTHORIZATION
        if (!accessResults.length || accessResults.every(r => r.result == undefined))
            return { rule: ruleSummary, action, source, access }

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




    private _evalPermission(p: Permission, action?: string, ctx?: { msg: IncomingMessage, additional?: Record<string, unknown> }): boolean | undefined {
        // if (!action || !p?.action) return undefined
        if (!ctx) return undefined
        if (typeof p === 'object' && 'by' in p) { //simple permission
            const permission = p as SimplePermission
            const access = permission.access === 'grant'
            const principle = ctx.msg.principle

            switch (p.by) {
                case 'anonymous': return principle ? undefined : access;
                case 'user': return principle ? access : undefined;
                case 'emv': return principle?.emv ? access : undefined;
                case 'phv': return principle?.phv ? access : undefined;

                case 'role':
                    {
                        const role = p.value
                        return principle?.roles?.some(r => r === role) ? access : undefined
                    }
                case 'email':
                    {
                        const email = p.value?.toLocaleLowerCase()
                        return principle?.email?.toLocaleLowerCase() === email ? access : undefined
                    }
                case 'phone':
                    {
                        const phone = p.value?.toLocaleLowerCase()
                        return principle?.phone?.toLocaleLowerCase() === phone ? access : undefined
                    }
                case 'claim':
                    {
                        //TODO: evaluate claimObject by its operator and value
                        const claimObject = p.value
                        const v = JsonPointer.get(principle?.claims, claimObject.claimFieldPath)
                        return v === claimObject.claimValue ? access : undefined;
                    }
                default: return access;
            }
        } else { //functional permission
            const r = evaluateOpExpression(p, ctx)
            return r === 'grant'
            // return authorizeFun(ctx) === 'grant' ? true : false
        }
    }


    private _isSuperAdmin(ctx: IncomingMessage) {
        const principle = ctx.principle!;
        return principle && principle.roles?.some((r: string) => r === 'super-admin' || r === 'developer');
    }
}