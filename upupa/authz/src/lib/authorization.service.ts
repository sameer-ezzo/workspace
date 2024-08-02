import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { RulesManager, Rule, Principle, AuthorizeMessage, AuthorizeResult, AuthorizeContext } from "@noah-ark/common";
import { _isSuperAdmin, authorize, evaluatePermission, matchPermissions } from "@noah-ark/expression-engine";
import { TreeBranch } from "@noah-ark/path-matcher";

import { isEmpty } from "lodash";
import { ReplaySubject, firstValueFrom } from "rxjs";
import { PERMISSIONS_BASE_URL } from "./di.tokens";


@Injectable({ providedIn: 'root' })
export class AuthorizationService {

    rulesManager: RulesManager = null;
    readonly rules$ = new ReplaySubject<TreeBranch<Rule>>(1);
    private readonly baseUrl = inject(PERMISSIONS_BASE_URL);
    private readonly http = inject(HttpClient);

    constructor() {
        this.http.get<TreeBranch<Rule>>(`${this.baseUrl}/rules`).subscribe(rules => {
            const rootRule = rules.item;
            this.rulesManager = new RulesManager(rootRule, []);
            this.rulesManager.tree = rules;
            this.rules$.next(rules);
        });
    }

    buildAuthorizationMsg(path: string, action: string, principle: Principle): AuthorizeMessage {
        return { path, operation: action, principle, payload: {}, query: {} };
    }


    async authorize(path: string, action: string, principle: Principle): Promise<AuthorizeResult> {
        await firstValueFrom(this.rules$);
        if (isEmpty(action ?? '')) action = undefined;
        const msg = this.buildAuthorizationMsg(path, action, principle);

        //BUILD CONTEXT AND ALLOW SUPER ADMIN
        if (_isSuperAdmin(msg)) return { rule: { name: 'builtin:super-admin', path: '**' }, action, access: 'grant' }

        const rule = this.rulesManager.getRule(path, true);
        const ruleSummary = rule ? { name: rule.name, path: rule.path, fallbackSource: rule.fallbackSource, ruleSource: rule.ruleSource } : undefined

        //ASSUME THE RESULT IS THE DEFAULT AUTHORIZATION AND BUILD THE CONTEXT
        const authorizationContext = { msg } as AuthorizeContext
        const result = {
            access: typeof rule.fallbackAuthorization === 'string' ? rule.fallbackAuthorization : 'deny',
            rule: ruleSummary,
            action,
            ctx: authorizationContext
        } as AuthorizeResult

        const grantingPermissions = await this.getEvaluatedQuerySelector(path, action, principle, true);
        result.access = grantingPermissions.length > 0 ? 'grant' : 'deny';

        return result;
    }


    async getEvaluatedQuerySelector(path: string, action: string, user: Principle, bypassSelectors = false) {
        const matches = await this.matchPermissions(path, action, user);
        const msg = this.buildAuthorizationMsg(path, action, user);
        if (bypassSelectors) return matches.filter(m => m.match).map(m => m.permission);

        const grantingPermissions = matches.filter(m => evaluatePermission(m.permission, { msg }) === 'grant')
            .map(m => m.permission)


        const simplestPermission = grantingPermissions
            .sort((a, b) => Object.keys(a.selectors?.query ?? {}).length - Object.keys(b.selectors?.query ?? {}).length)
            .shift();

        const evaluatedQuerySelector = matches.find(m => m.permission === simplestPermission)!.match.evaluated?.query;
        return evaluatedQuerySelector;
    }

    async matchPermissions(path: string, action: string, principle: Principle) {
        await firstValueFrom(this.rules$);
        const rule = this.rulesManager.getRule(path, true);
        const msg = this.buildAuthorizationMsg(path, action, principle);
        return matchPermissions(rule, action, { msg });
    }
}
