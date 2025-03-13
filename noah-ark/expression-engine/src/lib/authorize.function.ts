import { JsonPointer } from "@noah-ark/json-patch";
import {
    _NullPermissionTypes,
    _StringPermissionTypes,
    AccessType,
    AuthorizeContext,
    AuthorizeFun,
    AuthorizeMessage,
    PermissionSelectorsEvaluationContext,
    AuthorizeResult,
    FunctionalPermission,
    isObjectValuePermission,
    isPermissionSimple,
    ObjectValuePermission,
    Permission,
    permissionKey,
    Principle,
    Rule,
    SimplePermission,
    StringValuePermission,
} from "@noah-ark/common";

function _evaluatePermissionSelector(expression: Record<string, string>, ctx: AuthorizeContext): any {
    const evaluated = {};
    for (const p of Object.entries(expression)) {
        const [path, exp] = p;
        if (exp.startsWith("$")) {
            const value = JsonPointer.get(ctx, exp.substring(1), ".");
            JsonPointer.set(evaluated, path, value);
        } else JsonPointer.set(evaluated, path, exp);
    }
    return evaluated;
}

function matchPermissionSelectors(permission: Permission<boolean | AuthorizeFun>, ctx: AuthorizeContext, bypassSelectors = false): PermissionSelectorsEvaluationContext["match"] {
    let match = { result: true } as PermissionSelectorsEvaluationContext["match"];

    if (bypassSelectors === true || !permission.selectors) return match;
    const { query: queryExpression, payload: payloadExpression } = permission.selectors;

    const query = queryExpression ? _evaluatePermissionSelector(queryExpression as Record<string, string>, ctx) : undefined;
    const payload = payloadExpression ? _evaluatePermissionSelector(payloadExpression as Record<string, string>, ctx) : undefined;
    match = { evaluated: { query, payload }, result: true } as PermissionSelectorsEvaluationContext["match"];

    const msg = ctx.msg;

    if (match.result && query && Object.entries(query).some(([k, v]) => JsonPointer.get(msg.query, k) !== v)) match.result = false;

    if (match.result && payload && Object.entries(payload).some(([k, v]) => JsonPointer.get(msg.payload, k) !== v)) match.result = false;

    return match;
}

export type AuthorizationTemplate = { by: string; template: Pick<FunctionalPermission, "authorize" | "valueType"> };
export const AUTHORIZATION_TEMPLATES: Record<string, Pick<FunctionalPermission, "authorize">> = {
    anonymous: { authorize: (ctx: AuthorizeContext) => true },
    user: { authorize: (ctx: AuthorizeContext) => !!ctx.msg?.principle },
    emv: { authorize: (ctx: AuthorizeContext) => ctx.msg?.principle?.emv },
    phv: { authorize: (ctx: AuthorizeContext) => ctx.msg?.principle?.phv },
    role: {
        authorize: (ctx: AuthorizeContext, permission: StringValuePermission) => ctx.msg?.principle?.roles?.some((r) => r === permission.value),
    },
    email: { authorize: (ctx: AuthorizeContext, permission: StringValuePermission) => ctx.msg?.principle?.email?.toLocaleLowerCase() === permission.value },
    phone: { authorize: (ctx: AuthorizeContext, permission: StringValuePermission) => ctx.msg?.principle?.phone?.toLocaleLowerCase() === permission.value },
    claim: {
        authorize: (ctx: AuthorizeContext, permission: ObjectValuePermission) => {
            const claimObject = permission.value;
            const claimFieldPath = claimObject?.claimFieldPath;
            if (!claimFieldPath) return undefined;
            const value = JsonPointer.get(ctx.msg?.principle?.claims, claimObject.claimFieldPath);
            return value === claimObject.claimValue;
        },
    },
};

export function matchPermissions(
    rule: Rule,
    action: string,
    ctx: AuthorizeContext,
    bypassSelectors = false,
): { match: PermissionSelectorsEvaluationContext["match"]; permission: Permission<boolean | AuthorizeFun> }[] {
    return (rule.actions?.[action] ?? []).map((p) => ({
        match: matchPermissionSelectors(p, ctx, bypassSelectors),
        permission: p,
    }));
}

/**
 *
 * @param msg The message object to be authorized (it contains the path to the rule object and it contains the principle object)
 * @param action A string key that points to the specific permission inside the rule object @default rule.operation
 * @param additional Any data useful for the authorization function @example { new_data, old_data }
 * @returns grant or deny access for the provided msg/action
 */
export function authorize(msg: AuthorizeMessage, rule: Rule, action?: string, bypassSelectors = false, additional?: Record<string, unknown>): AuthorizeResult {
    //BUILD CONTEXT AND ALLOW SUPER ADMIN
    action ??= msg.operation;
    if (_isSuperAdmin(msg)) return { rule: { name: "builtin:super-admin", path: "**" }, action, access: "grant" };

    const ruleSummary = rule ? { name: rule.name, path: rule.path, fallbackSource: rule.fallbackSource, ruleSource: rule.ruleSource } : undefined;

    //ASSUME THE RESULT IS THE DEFAULT AUTHORIZATION AND BUILD THE CONTEXT
    const authorizationContext = { msg, additional } as AuthorizeContext;
    const result = {
        access: typeof rule.fallbackAuthorization === "string" ? rule.fallbackAuthorization : "deny",
        rule: ruleSummary,
        action,
        ctx: authorizationContext,
    } as AuthorizeResult;

    //MATCH PERMISSIONS (CHECK PERMISSIONS SELECTORS)
    const matches = matchPermissions(rule, action, authorizationContext, bypassSelectors);
    authorizationContext.permissions = matches.reduce((a, b) => ({ ...a, [permissionKey(b.permission)]: b }), {});
    let permissions = matches.filter((m) => m.match.result).map((m) => m.permission);

    //FALLBACK TO PARENT RULE PERMISSIONS
    if (!permissions.length) return result;

    //EVALUATE PERMISSIONS
    for (const p of permissions) {
        const access = evaluatePermission(p, authorizationContext);
        if (access === undefined) continue;
        authorizationContext.permissions![permissionKey(p)].result = access;

        result.access = access ? access : result.access;
        if (result.access === "deny") break; //no need to check further
    }

    return result;
}

export function evaluatePermission(p: Permission<boolean | AuthorizeFun>, ctx?: AuthorizeContext): AccessType | undefined {
    if (isPermissionSimple(p)) {
        const authorizeTemplate = AUTHORIZATION_TEMPLATES[p.by];
        if (!authorizeTemplate) throw new Error(`Authorization template ${p.by} not found`);
        return authorizeTemplate.authorize(ctx, p as any) ? p.access : undefined;
    } else {
        //functional permission
        throw new Error("Functional permissions are not supported yet");
        // return evaluateOpExpression(p, ctx) === undefined ? undefined : p.access
    }
}

export function _isSuperAdmin(ctx: AuthorizeMessage) {
    const principle = ctx.principle!;
    return principle && principle.roles?.some((r: string) => r === "super-admin" || r === "developer");
}
