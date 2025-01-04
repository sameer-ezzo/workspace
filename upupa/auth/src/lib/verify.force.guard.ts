import { Injectable, Inject, inject } from "@angular/core";
import { CanActivate, CanActivateChild, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from "@angular/router";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { AuthService } from "./auth.service";

@Injectable({ providedIn: 'root' })
export class EmailVerifiedGuard implements CanActivate, CanActivateChild {

    router = inject(Router)
    authService = inject(AuthService)
    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
        return this.authService.user$.pipe(map(user => { return user?.emv === true ? true : this.reject(user) }));
    }

    canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        return this.canActivate(route, state);
    }

    reject(user): boolean {
        // if (user) this.router.navigateByUrl(this.verifyUrl);
        // else this.router.navigateByUrl(this.signinUrl);
        return false;
    }
}

@Injectable({ providedIn: 'root' })
export class PhoneVerifiedGuard implements CanActivate, CanActivateChild {
    router = inject(Router)
    authService = inject(AuthService)
    // private signinUrl = inject(DEFAULT_LOGIN_PROVIDER_TOKEN) as string
    // private verifyUrl = inject(DEFAULT_VERIFY_PROVIDER_TOKEN) as string

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
        return this.authService.user$.pipe(map(user => {
            if (user?.phv) return true;
            return this.reject(user);
        }));

    }
    canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        return this.canActivate(route, state);
    }

    reject(user): boolean {
        // if (user) this.router.navigateByUrl(this.verifyUrl);
        // else this.router.navigateByUrl(this.signinUrl);
        return false;
    }
}