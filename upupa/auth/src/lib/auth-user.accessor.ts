import { Injectable, Signal, inject } from "@angular/core";
import { Principle } from "@noah-ark/common";
import { Observable } from "rxjs";
import { HttpRequest } from "@angular/common/http";
import { AuthService } from "./auth.service";

@Injectable({ providedIn: "root" })
export class AuthUserAccessor {
    private readonly auth = inject(AuthService);

    get user$(): Observable<Principle | null> {
        return this.auth.user$;
    }

    get userSignal(): Signal<Principle | null> {
        return this.auth.userSignal;
    }

    get user(): Principle | null {
        return this.auth.user;
    }

    fromRequest(req: Request | HttpRequest<unknown> | null): Principle | null {
        return this.auth.fromCookies(req);
    }

    hasRole(role: string): boolean {
        return !!this.auth.hasRole(role);
    }

    hasAnyRole(...roles: string[]): boolean {
        return !!this.auth.hasAnyRole(...roles);
    }

    hasClaim(claim: string, value?: string): boolean {
        return !!this.auth.hasClaim(claim, value);
    }
}