import { HttpClient } from "@angular/common/http";
import { Injectable, afterNextRender, inject } from "@angular/core";
import { RulesManager, Rule, Principle, AuthorizeMessage, AuthorizeResult } from "@noah-ark/common";
import { authorize, evaluatePermission, selectPermissions } from "@noah-ark/expression-engine";
import { TreeBranch } from "@noah-ark/path-matcher";

import { ReplaySubject, firstValueFrom, shareReplay } from "rxjs";
import { PERMISSIONS_BASE_URL } from "./di.tokens";

@Injectable({ providedIn: "root" })
export class AuthorizationService {
    rulesManager?: RulesManager;
    readonly rules$ = new ReplaySubject<TreeBranch<Rule>>(1);
    private readonly baseUrl? = inject(PERMISSIONS_BASE_URL, { optional: true });
    private readonly http = inject(HttpClient);
    private updateRules = (rules: TreeBranch<Rule>) => {
        if (!rules || !rules.item) return undefined;
        const rootRule = rules.item!;
        this.rulesManager = new RulesManager(rootRule);
        this.rulesManager.tree = rules;
        this.rules$.next(rules);
        return rules;
    };
    constructor() {
        if (!this.baseUrl) {
            console.warn("PERMISSIONS_BASE_URL is not provided, therefore the authorization service will not sync with the server");
            this.rulesManager = new RulesManager({ name: "root", path: "/", fallbackAuthorization: "grant" });
            return;
        }
        afterNextRender(() =>
            this.http
                .get<TreeBranch<Rule>>(`${this.baseUrl}/rules`)
                .pipe(shareReplay(1))
                .subscribe((rules) => {
                    this.updateRules(rules);
                }),
        );
    }

    buildAuthorizationMsg(path: string, action: string, principle: Principle, payload?: unknown, query?: unknown, ctx?: unknown): AuthorizeMessage {
        return { path, operation: action, principle, payload: payload ?? {}, query: query ?? {}, ctx: ctx ?? {} } as AuthorizeMessage;
    }

    async authorize(path: string, action: string, principle: Principle, payload?: unknown, query?: unknown, ctx?: unknown): Promise<AuthorizeResult> {
        await firstValueFrom(this.rules$);
        if ((action ?? "").trim().length === 0) action = undefined;
        const message = this.buildAuthorizationMsg(path, action, principle, payload, query, ctx);
        const segments = path.split("/");
        while (segments.length > 0) {
            const rule = this.rulesManager.getRule(path, true);
            const res = authorize(message, rule, action, true);

            if (res.access) return res;

            segments.pop();
            path = segments.join("/");
        }

        return { rule: undefined, action, access: "deny" };
    }

    async getEvaluatedSelector(
        path: string,
        action: string,
        user: Principle,
        bypassSelectors = false,
        payload?: unknown,
        query?: unknown,
        ctx?: unknown,
    ): Promise<{ query?: any; payload?: any }> {
        const matches = await this.matchPermissions(path, action, user, bypassSelectors);
        const msg = this.buildAuthorizationMsg(path, action, user, payload, query, ctx);
        const grantingPermissions = matches.filter((m) => evaluatePermission(m.permission, { msg }) === "grant").map((m) => m.permission);

        if (bypassSelectors) return {};

        const simplestPermission = grantingPermissions.sort((a, b) => Object.keys(a.selectors?.query ?? {}).length - Object.keys(b.selectors?.query ?? {}).length).shift();

        const evaluatedQuerySelector = simplestPermission ? matches.find((m) => m.permission === simplestPermission)!.match.evaluated : {};
        return evaluatedQuerySelector;
    }

    async getEvaluatedQuerySelector(path: string, action: string, user: Principle, bypassSelectors = false, payload?: unknown, query?: unknown, ctx?: unknown) {
        return (await this.getEvaluatedSelector(path, action, user, bypassSelectors, payload, query, ctx))?.query;
    }

    async matchPermissions(path: string, action: string, principle: Principle, bypassSelectors = false) {
        await firstValueFrom(this.rules$);
        const rule = this.rulesManager.getRule(path, true);
        const msg = this.buildAuthorizationMsg(path, action, principle);
        return selectPermissions(rule, action, { msg }, bypassSelectors);
    }
}
