import { Injectable, Injector } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot, CanActivateChild, ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { DEFAULT_FORBIDDEN_PROVIDER_TOKEN, DEFAULT_LOGIN_PROVIDER_TOKEN } from './di.token';
import {CanActivateFn} from "@angular/router";
import {FusionAuthService} from "@fusionauth/angular-sdk";
import {inject} from "@angular/core";

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate, CanActivateChild {

    constructor(public router: Router,
        private route: ActivatedRoute,
        public authService: AuthService,
        private injector: Injector) {
    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
        const user = this.authService.user;

        if (!user) return this.reject(user);
        const data = route.routeConfig.data ?? {};
        const { rule, roles } = data as { rule: (user) => boolean, roles: string[] }
        // const roles: string[] = route.routeConfig.data ? route.routeConfig.data.roles : null;
        if (rule && !rule(user)) { return this.reject(user); }
        if (roles && !(user.roles ?? []).some(r => roles.indexOf(r) > -1)) { return this.reject(user); }
        return true;
    }
    canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        return this.canActivate(route, state);
    }

    reject(user): boolean {
        if (user) {
            const forbiddenUrl = this.injector.get(DEFAULT_FORBIDDEN_PROVIDER_TOKEN, '/forbidden') as string
            this.router.navigateByUrl(forbiddenUrl ?? '');
        } else {
            const signInUrl = this.injector.get(DEFAULT_LOGIN_PROVIDER_TOKEN, '/login') as string
            this.router.navigateByUrl(signInUrl);
        }
        return false;
    }
}




// export function FusionAuthGuard(loggedIn: boolean, redirect: string): CanActivateFn {
//   return () => {
//     const fusionAuthService = inject(FusionAuthService);
//     const router = inject(Router);
//     return fusionAuthService.isLoggedIn() === loggedIn || router.createUrlTree([redirect]);
//   }
// }
