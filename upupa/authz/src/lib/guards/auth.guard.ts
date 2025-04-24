import { inject, InjectionToken, Injector, PLATFORM_ID, runInInjectionContext } from "@angular/core";
import { ActivatedRoute, ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from "@angular/router";
import { AuthService } from "@upupa/auth";
import { AuthorizationService } from "../authorization.service";
import { firstValueFrom } from "rxjs";
import { isPlatformServer, Location } from "@angular/common";

export type AuthGuardOptions = {
    path?: string;
    action?: string;
    payload?: unknown;
    query?: unknown;
    ctx?: unknown;
    loginRedirect?: () => void;
    forbiddenRedirect?: () => void;
};
export const defaultLoginRedirect = (loginRoute: string | string[] = ["/login"], redirectToParamName = "redirectTo") => {
    const router = inject(Router);
    const route = inject(ActivatedRoute);
    const location = inject(Location);
    const qps = route.snapshot.queryParams;
    let redirectTo = ((redirectToParamName ? (qps[redirectToParamName] ?? location.path()) : location.path()) || "").trim();

    redirectTo = redirectTo.startsWith("/") ? redirectTo : `/${redirectTo}`;

    router.navigate(Array.isArray(loginRoute) ? loginRoute : [loginRoute], { queryParams: { ...qps, redirectTo } });
};

const defaultForbiddenRedirect = () => {
    const router = inject(Router);
    router.navigateByUrl("/forbidden");
};
export const authGuardFn = (options: AuthGuardOptions) => {
    let { path, action, payload, query, ctx, loginRedirect, forbiddenRedirect } = options;
    loginRedirect = loginRedirect || defaultLoginRedirect;
    forbiddenRedirect = forbiddenRedirect || defaultForbiddenRedirect;

    return async (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
        if (isPlatformServer(PLATFORM_ID)) {
            // If not in browser, we don't need to check auth. To avoid having login page rendered if the user is logged in.
            // on the server side there is no auth token stored in local storage therefore the user is not logged in. while he is logged in on the client side.
            return true;
        }

        const authService = inject(AuthService);
        const authz = inject(AuthorizationService);
        const injector = inject(Injector);

        const user = await firstValueFrom(authService.user$);
        if (!user) {
            runInInjectionContext(injector, loginRedirect);
            return false;
        }

        path = path || route.data["$path"];
        action = action || route.data["$action"];
        payload = payload || route.data["$payload"];
        query = query || route.queryParams["query"] || null;
        ctx = ctx || route.data["ctx"] || null;

        if (path) {
            const res = await authz.authorize(path, action, user, payload, query, ctx);
            if (res.access === "deny") {
                runInInjectionContext(injector, forbiddenRedirect);
                return false;
            }
            if (res.access === "grant") {
                return true;
            }
        }

        return true;
    };
};
