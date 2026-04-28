import { Injectable, inject } from "@angular/core";
import { AUTH_OPTIONS } from "./di.token";
import { httpFetch } from "./http-fetch.function";
import { SigninResponse, SocialAuthRequest, TokenPairResponse } from "@noah-ark/common";
import { Verification } from "./model";

@Injectable()
export class AuthApiClient {
    private readonly options = inject(AUTH_OPTIONS, { optional: false });
    private readonly _baseUrl = this.options.baseUrl;

    public get baseUrl(): string {
        return this._baseUrl;
    }

    checkUser(usernameOrEmailOrPhone: string): Promise<{ canLogin: boolean } & Record<string, unknown>> {
        return httpFetch(`${this.baseUrl}/check-user`, { usernameOrEmailOrPhone });
    }

    refresh(refresh_token: string): Promise<TokenPairResponse> {
        return httpFetch(this.baseUrl, { grant_type: "refresh", refresh_token });
    }

    signout(): Promise<{ success: boolean }> {
        return fetch(`${this.baseUrl}/signout`, { method: "GET", credentials: "include" }).then(async (response) => {
            const body = (await response.json().catch(() => null)) as { success?: boolean } | null;
            if (!response.ok) {
                throw { status: response.status, body, message: body?.["message"] ?? "SIGNOUT_FAILED" };
            }
            return { success: body?.success === true };
        });
    }

    signin(payload: Record<string, unknown>): Promise<SigninResponse> {
        return httpFetch(this.baseUrl, payload);
    }

    signup(user: Record<string, unknown>, password: string): Promise<Record<string, unknown>> {
        return httpFetch(`${this.baseUrl}/signup`, { ...user, password });
    }

    forgotPassword(email: string, payload?: Record<string, unknown>): Promise<Record<string, unknown>> {
        return httpFetch(`${this.baseUrl}/forgot-password`, { ...(payload ?? {}), email: email.trim().toLocaleLowerCase() });
    }

    resetPassword(new_password: string, reset_token: string): Promise<boolean> {
        return httpFetch(`${this.baseUrl}/resetpassword`, { new_password, reset_token });
    }

    signinGoogle(user: SocialAuthRequest & { token: string }): Promise<TokenPairResponse> {
        return httpFetch(`${this.baseUrl}/google-auth`, user);
    }

    signinFacebook(user: SocialAuthRequest & { token: string }): Promise<TokenPairResponse> {
        return httpFetch(`${this.baseUrl}/facebook-auth`, { ...user, access_token: user.token });
    }

    signinProvider(provider: string, token: string): Promise<SigninResponse> {
        return httpFetch(`${this.baseUrl}/${provider}-auth`, { token });
    }

    impersonate(sub: string): Promise<TokenPairResponse> {
        return httpFetch(`${this.baseUrl}/impersonate`, { sub });
    }

    sendVerificationCode(name: string, value: string, payload?: Record<string, unknown>): Promise<boolean> {
        const post = { name, value, [name]: value, ...(payload ?? {}) };
        return httpFetch(`${this.baseUrl}/verify/send`, post).then(() => true);
    }

    verify(name: string, verification: Verification): Promise<unknown> {
        return httpFetch(`${this.baseUrl}/verify`, { name, ...verification });
    }
}
