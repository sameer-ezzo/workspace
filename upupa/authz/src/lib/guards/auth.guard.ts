import { inject, InjectionToken, Injector, PLATFORM_ID, runInInjectionContext } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivateFn, RouterStateSnapshot } from "@angular/router";
import { AuthService } from "@upupa/auth";
import { AuthorizationService } from "../authorization.service";
import { firstValueFrom } from "rxjs";
import { isPlatformServer } from "@angular/common";

export const LOGIN_REDIRECT = new InjectionToken<() => void>("LOGIN_REDIRECT");
export const FORBIDDEN_REDIRECT = new InjectionToken<() => void>("FORBIDDEN_REDIRECT");

export const authGuardFn: CanActivateFn = async (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    if (isPlatformServer(PLATFORM_ID)) {
        // If not in browser, we don't need to check auth. To avoid having login page rendered if the user is logged in.
        // on the server side there is no auth token stored in local storage therefore the user is not logged in. while he is logged in on the client side.
        return true;
    }

    const authService = inject(AuthService);
    const authz = inject(AuthorizationService);
    const injector = inject(Injector);
    const loginRedirect = inject(LOGIN_REDIRECT, { optional: true });
    const forbiddenRedirect = inject(FORBIDDEN_REDIRECT, { optional: true });

    const user = await firstValueFrom(authService.user$);
    if (!user) {
        runInInjectionContext(injector, loginRedirect);
        return false;
    }

    const path = route.data["$path"];
    const action = route.data["$action"];
    const payload = route.data["$payload"];
    const query = route.queryParams["query"] || null;
    const ctx = route.data["ctx"] || null;
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
