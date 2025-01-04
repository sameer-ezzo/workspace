import { Injectable, Injector } from "@angular/core";
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot, CanActivateChild, ActivatedRoute } from "@angular/router";
import { Observable } from "rxjs";
import { AuthService } from "./auth.service";
import { Principle } from "@noah-ark/common";

@Injectable({ providedIn: "root" })
export class AuthGuard implements CanActivate, CanActivateChild {
    constructor(
        public router: Router,
        private route: ActivatedRoute,
        public authService: AuthService,
        private injector: Injector,
    ) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
        const user = this.authService.user;

        if (!user) return this.reject(user);
        const data = route.routeConfig?.data ?? {};
        const { rule, roles } = data as { rule: (user: Principle) => boolean; roles: string[] };
        // const roles: string[] = route.routeConfig.data ? route.routeConfig.data.roles : null;
        if (rule && !rule(user)) {
            return this.reject(user);
        }
        if (roles && !(user.roles ?? []).some((r) => roles.indexOf(r) > -1)) {
            return this.reject(user);
        }
        return true;
    }
    canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        return this.canActivate(route, state);
    }

    reject(user: Principle | undefined): boolean {
        // if (user) {
        //     const forbiddenUrl = this.injector.get(DEFAULT_FORBIDDEN_PROVIDER_TOKEN, "/forbidden") as string;
        //     this.router.navigateByUrl(forbiddenUrl ?? "");
        // } else {
        //     const signInUrl = this.injector.get(DEFAULT_LOGIN_PROVIDER_TOKEN, "/login", { optional: true }) as string;
        //     console.log("REJECTING USER", user, 'REDIRECTING TO', signInUrl);
        //     this.router.navigateByUrl(signInUrl);
        // }
        return false;
    }
}
