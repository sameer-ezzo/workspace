import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { RulesManager, Rule, Principle, AuthorizeMessage, AuthorizeResult } from "@noah-ark/common";
import { authorize, matchPermissions } from "@noah-ark/expression-engine";
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

        const rule = this.rulesManager.getRule(path, true);
        const msg = this.buildAuthorizationMsg(path, action, principle);
        const authResult = authorize(msg, rule, action);
        return authResult;
    }

    async matchPermissions(path: string, action: string, principle: Principle) {
        await firstValueFrom(this.rules$);
        const rule = this.rulesManager.getRule(path, true);
        const msg = this.buildAuthorizationMsg(path, action, principle);
        return matchPermissions(rule, action, { msg });
    }
}
