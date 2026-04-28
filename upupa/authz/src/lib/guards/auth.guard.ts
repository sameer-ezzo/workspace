import { inject, Injector, runInInjectionContext } from "@angular/core";
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from "@angular/router";
import { AuthUserAccessor } from "@upupa/auth";
import { AuthorizationService } from "../authorization.service";
import { Location } from "@angular/common";

export type GuardRedirectResult = boolean | UrlTree | Promise<boolean | UrlTree>;
export type GuardRedirectFn = (ctx: { route: ActivatedRouteSnapshot; state: RouterStateSnapshot }) => GuardRedirectResult;

export type AuthGuardOptions = {
    path?: string;
    action?: string;
    payload?: unknown;
    query?: unknown;
    ctx?: unknown;
    loginRedirect?: GuardRedirectFn;
    forbiddenRedirect?: GuardRedirectFn;
};
export const defaultLoginRedirect = (loginRoute: string | string[] = ["/login"], redirectToParamName = "redirectTo"): GuardRedirectFn => {
    return ({ route, state }) => {
        const router = inject(Router);
        const location = inject(Location);
        const qps = route.queryParams ?? {};
        let redirectTo = ((redirectToParamName ? (qps[redirectToParamName] ?? state.url ?? location.path()) : (state.url ?? location.path())) || "").trim();

        redirectTo = redirectTo.startsWith("/") ? redirectTo : `/${redirectTo}`;

        const queryParams = redirectToParamName ? { ...qps, [redirectToParamName]: redirectTo } : { ...qps };
        return router.createUrlTree(Array.isArray(loginRoute) ? loginRoute : [loginRoute], { queryParams });
    };
};

const defaultForbiddenRedirect: GuardRedirectFn = () => {
    const router = inject(Router);
    return router.createUrlTree(["/forbidden"]);
};

const resolveRedirect = async (injector: Injector, redirect: GuardRedirectFn, route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean | UrlTree> => {
    const redirectResult = await Promise.resolve(runInInjectionContext(injector, () => redirect({ route, state })));
    return redirectResult === undefined ? false : redirectResult;
};

export const authGuardFn = (options: AuthGuardOptions) => {
    let { path, action, payload, query, ctx, loginRedirect, forbiddenRedirect } = options;
    loginRedirect = loginRedirect || defaultLoginRedirect();
    forbiddenRedirect = forbiddenRedirect || defaultForbiddenRedirect;

    return async (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
        const auth = inject(AuthUserAccessor);
        const authz = inject(AuthorizationService);
        const injector = inject(Injector);

        const user = auth.user;
        if (!user) {
            return resolveRedirect(injector, loginRedirect, route, state);
        }

        path = path || route.data["$path"];
        action = action || route.data["$action"];
        payload = payload || route.data["$payload"];
        query = query || route.queryParams["query"] || null;
        ctx = ctx || route.data["ctx"] || null;

        if (path && action) {
            const res = await authz.authorize(path, action, user, payload, query, ctx);
            if (res.access === "deny") {
                return resolveRedirect(injector, forbiddenRedirect, route, state);
            }
            if (res.access === "grant") {
                return true;
            }
        }

        return true;
    };
};
