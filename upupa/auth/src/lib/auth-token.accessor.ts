import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { AuthService } from "./auth.service";

@Injectable({ providedIn: "root" })
export class AuthTokenAccessor {
    private readonly auth = inject(AuthService);

    get token$(): Observable<string | null> {
        return this.auth.token$;
    }

    getToken(): string {
        return this.auth.get_token();
    }

    getRefreshToken(): string {
        return this.auth.get_refresh_token();
    }
}