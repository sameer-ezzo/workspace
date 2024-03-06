import { Injectable } from "@nestjs/common";
import { AuthorizeResult, IncomingMessage, Permission, PrincipleBase, SimplePermission } from '@noah-ark/common';
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
        action ??= msg.operation //TODO make sure action is provided in some list (so for example client side would know all possible action ahead of time)
        if (!action) throw new Error('action is not provided')
        if (this._isSuperAdmin(msg)) return { rule: { name: 'builtin:super-admin', path: '**' }, action, source: 'default', access: 'grant' }

        const rule = this.rulesService.getRule(msg.path, true)! // use default app rule
        const ruleSummary = rule ? { name: rule.name, path: rule.path } : undefined

        //AUTHORIZE BY PERMISSION (GET PERMISSIONS THAT HAS THE ANSWER FOR THIS ACTION)
        const permissions = (rule.actions?.[action] ?? rule.actions?.['*'] ?? [])
        const accessResults = permissions.map(p => this._evalPermission(p, action, { msg, additional }))
        if (accessResults.every(ar => ar !== undefined)) {
            return { rule: ruleSummary, action, source: `permission: ${action}`, access: accessResults.some(ar => ar === true) ? 'grant' : (rule.fallbackAuthorization ?? 'deny') }
        }

        //STEP 4: FALLBACK TO DEFAULT AUTHORIZATION
        return { rule: ruleSummary, action, source: 'default', access: rule.fallbackAuthorization ?? 'deny' }
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