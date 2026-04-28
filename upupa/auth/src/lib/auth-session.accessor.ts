import { Injectable, inject } from "@angular/core";
import { Principle } from "@noah-ark/common";
import { AuthService } from "./auth.service";

@Injectable({ providedIn: "root" })
export class AuthSessionAccessor {
    private readonly auth = inject(AuthService);

    signout(): Promise<unknown> {
        return this.auth.signout();
    }

    refresh(refresh_token?: string): Promise<Principle | null> {
        return this.auth.refresh(refresh_token);
    }

    unimpersonate(): Promise<Principle | null> {
        return this.auth.unimpersonate();
    }

    impersonate(sub: string): Promise<Principle | { type: "reset-pwd"; reset_token: string } | null> {
        return this.auth.impersonate(sub);
    }
}