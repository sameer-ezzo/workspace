import { Injectable, PLATFORM_ID, REQUEST, Signal, inject, DOCUMENT } from "@angular/core";
import { ReplaySubject, interval, Subject, firstValueFrom } from "rxjs";
import { delayWhen } from "rxjs/operators";
import { AUTH_OPTIONS } from "./di.token";
import { HttpClient } from "@angular/common/http";
import { Credentials, Verification } from "./model";
import { Router } from "@angular/router";
import { httpFetch } from "./http-fetch.function";
import { analyzePassword, MutexAsync, Principle } from "@noah-ark/common";

import { DeviceService } from "./device.service";
import { isPlatformBrowser } from "@angular/common";
import { AUTH_IDPs, IdPName } from "./idps";
import { toSignal } from "@angular/core/rxjs-interop";

export const ACCESS_TOKEN = "token";
export const REFRESH_TOKEN = "refresh_token";

export interface TokenStore {
    getToken(key: string): string;
    setToken(key: string, value: string): void;
    removeToken(key: string): void;

    getAccessToken(): string;
    getRefreshToken(): string;

    setAccessToken(access_token: string);
    setRefreshToken(refresh_token: string);

    removeRefreshToken();
    removeAccessToken();
}

export class LocalStorageTokenStore implements TokenStore {
    getToken(key: string): string {
        return localStorage.getItem(key) ?? "";
    }
    setToken(key: string, value: string): void {
        localStorage.setItem(key, value);
    }
    removeToken(key: string): void {
        localStorage.removeItem(key);
    }

    getAccessToken(): string {
        return this.getToken(ACCESS_TOKEN);
    }
    getRefreshToken(): string {
        return this.getToken(REFRESH_TOKEN);
    }
    setAccessToken(access_token: string) {
        this.setToken(ACCESS_TOKEN, access_token);
    }
    setRefreshToken(refresh_token: string) {
        this.setToken(REFRESH_TOKEN, refresh_token);
    }
    removeAccessToken() {
        this.removeToken(ACCESS_TOKEN);
    }
    removeRefreshToken() {
        this.removeToken(REFRESH_TOKEN);
    }
}

export class RequestTokenStore implements TokenStore {
    req = inject(REQUEST);

    getHeader(key: string): string {
        return this.req?.headers.get(key) ?? "";
    }
    getCookie(key: string): string {
        const cookie = this.req?.headers.get("cookie");
        if (cookie) {
            const cookies = cookie.split("; ");
            for (const c of cookies) {
                const [name, value] = c.split("=");
                if (name === key) {
                    return decodeURIComponent(value);
                }
            }
        }
        return "";
    }

    getAccessToken(): string {
        return this.getHeader("Authorization") ?? this.getCookie(ACCESS_TOKEN);
    }
    getRefreshToken(): string {
        return ""; // no refresh token in request
    }

    getToken(key: string): string {
        return this.getHeader(key) || this.getCookie(key);
    }

    setToken(key: string, value: string): void {
        throw new Error("Method not implemented.");
    }
    removeToken(key: string): void {
        throw new Error("Method not implemented.");
    }

    removeRefreshToken() {
        this.removeToken(REFRESH_TOKEN);
    }
    removeAccessToken() {
        this.removeToken(ACCESS_TOKEN);
    }
    setAccessToken(access_token: string) {
        this.setToken(ACCESS_TOKEN, access_token);
    }
    setRefreshToken(refresh_token: string) {
        this.setToken(REFRESH_TOKEN, refresh_token);
    }
}

@Injectable({ providedIn: "root" })
export class AuthService {
    isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
    refreshed$ = new Subject<number>();
    private _user$ = new ReplaySubject<Principle>(1);
    user$ = this._user$.asObservable();
    userSignal: Signal<Principle> = toSignal(this._user$);
    user: Principle = null;

    private _token$ = new Subject<string>();
    token$ = this._token$.asObservable();

    // observeUrlAccessToken$ = interval(200).pipe(
    //     filter(() => !this.router),
    //     take(1),
    //     switchMap((x) => this.router.events),
    //     filter((e) => e instanceof ActivationEnd), //if access_token is provided by the link switch to it
    //     tap((e: ActivationEnd) => {
    //         const access_token = e.snapshot.queryParams["access_token"];
    //         const principle = this.jwt(access_token);
    //         if (access_token && principle) {
    //             const refresh_token = e.snapshot.queryParams["refresh_token"] || this.get_refresh_token();
    //             this.setTokens({ access_token, refresh_token });
    //             this.triggerNext(principle);
    //         }
    //     }),
    //     switchMap((x) => this.user$),
    // );

    private readonly localStorage: TokenStore = this.isBrowser ? new LocalStorageTokenStore() : new RequestTokenStore();

    public readonly options = inject(AUTH_OPTIONS);
    public readonly baseUrl = this.options.base_url;
    readonly authIdPs = inject(AUTH_IDPs, { optional: true }) ?? [];
    get IdProviders(): IdPName[] {
        return this.authIdPs.map((x) => x.IdpName);
    }
    getProviderByName(providerName: IdPName): any {
        const idp = this.authIdPs.find((x) => x.IdpName === providerName);
        if (!idp) throw new Error(`Provider ${providerName} not found`);
        return idp;
    }

    public readonly router = inject(Router);
    public readonly httpAuthorized = inject(HttpClient);
    public readonly deviceService = inject(DeviceService);

    get passwordPolicy() {
        return Object.freeze(this.options.password_policy);
    }

    constructor() {
        const user = this.jwt(this.get_token());
        this.triggerNext(user);

        if (this.isBrowser) {
            //auto refresh identity
            this.refreshed$.pipe(delayWhen(() => interval(1000 * 60 * 15))).subscribe(() => this.refresh());
            this.refresh();
        } else {
            this.refresh();
        }
    }

    private readonly doc = inject(DOCUMENT);
    private setupBeforeUnloadListener(): void {
        console.warn("User Tokens will be removed on page refresh");
        this.doc.defaultView.addEventListener("beforeunload", (event) => {
            this.setTokens(null);
        });
    }

    private triggerNext(user: any) {
        if (user) {
            user.emailVerified = user.emv === 1 || user.emailVerified === true;
            user.phoneVerified = user.phv === 1 || user.phoneVerified === true;
            delete user.emv;
            delete user.phv;
        }

        this.user = user;
        this._user$.next(user);
        //todo connected to /api/user as ws to fetch/subscribe to user changes
    }

    get_token() {
        return this.localStorage.getAccessToken();
    }
    get_refresh_token() {
        return this.localStorage.getRefreshToken();
    }

    jwt(tokenString: string): any {
        try {
            const base64Url = tokenString.split(".")[1];
            const base64 = base64Url.replace("-", "+").replace("_", "/");
            const token = JSON.parse(
                atob(base64),
                // Buffer.from(base64, 'base64')
            );

            const now = new Date();
            const expire = new Date(token.exp * 1000);
            if (now > expire) return null;
            return token;
        } catch (err) {
            return null;
        }
    }
    signout() {
        this.localStorage.removeAccessToken();
        this.localStorage.removeRefreshToken();
        this.triggerNext(null);
    }

    async checkUser(usernameOrEmailOrPhone: string): Promise<{ canLogin: boolean } & Record<string, unknown>> {
        return httpFetch(`${this.baseUrl}/check-user`, { usernameOrEmailOrPhone });
    }

    // async refresh(refresh_token?: string): Promise<Principle | null> {
    //     if (this._refreshPromise) return this._refreshPromise;
    //     this._refreshPromise = this._refresh(refresh_token);
    //     try {
    //         return await this._refreshPromise;
    //     } finally {
    //         this._refreshPromise = null;
    //     }
    // }
    // _refreshPromise: Promise<Principle | null> = null;

    @MutexAsync()
    async refresh(refresh_token?: string): Promise<Principle | null> {
        refresh_token = refresh_token ? refresh_token : this.get_refresh_token();
        let principle: Principle = null;
        if (refresh_token) {
            try {
                const tokens = await httpFetch(this.baseUrl, { grant_type: "refresh", refresh_token });
                if (tokens) {
                    this.setTokens(tokens);
                    principle = this.jwt(tokens.access_token) as Principle;
                    this.refreshed$.next(Date.now());
                    return principle;
                }
            } catch (error) {
                const status = `${error.status ?? 0}`;
                if (status.startsWith("4")) {
                    console.warn("SIGNING OUT: ", error);
                    this.signout();
                } else if (status === "0") {
                    console.warn("Network error: ", error);
                } else {
                    console.error("Error refreshing token: ", error);
                }
                return principle;
            }
        }
        this.triggerNext(principle);
        return principle;
    }

    private setTokens(tokens: { access_token: string; refresh_token: string }) {
        if (tokens) {
            this.localStorage.setAccessToken(tokens?.access_token);
            this.localStorage.setRefreshToken(tokens?.refresh_token);
        } else {
            this.localStorage.removeAccessToken();
            this.localStorage.removeRefreshToken();
        }
        this._token$.next(tokens?.access_token);
    }
    async signin_Google(user: { token: string }) {
        const res = await httpFetch(`${this.baseUrl}/google-auth`, user);
        this.setTokens(res);
        const principle = this.jwt(res.access_token);
        this.triggerNext(principle);
        return principle;
    }

    async signin_Facebook(user) {
        const res = await httpFetch(`${this.baseUrl}/facebook-auth`, user);
        this.setTokens(res);
        const principle = this.jwt(res.access_token);
        this.triggerNext(principle);
        return principle;
    }

    async signinWithProvider<Name extends IdPName>(provider: Name): Promise<Principle | { type: "reset-pwd"; reset_token: string }> {
        const idp = this.getProviderByName(provider);

        try {
            const e = await idp.signin();
            const auth_token = await httpFetch(`${this.baseUrl}/${provider}-auth`, { token: e.credential });

            if (!auth_token) throw "UNDEFINED_TOKEN";
            if ("reset_token" in auth_token) {
                const jwt = this.jwt(auth_token.reset_token);
                if (jwt?.t === "rst") return { type: "reset-pwd", reset_token: auth_token.reset_token };
                else throw "INVALID_TOKEN_TYPE";
            } else {
                const jwt = this.jwt(auth_token.access_token);
                this.setTokens(auth_token);
                this.triggerNext(jwt);
                return jwt as Principle;
            }
        } catch (err) {
            console.log(err);
        }

        return null;
    }
    async signin(credentials: Credentials & { rememberMe?: boolean }): Promise<Principle | { type: "reset-pwd"; reset_token: string }> {
        const authRequestBody: Record<string, string | any> = { grant_type: "password", rememberMe: false, password: credentials.password, device: undefined };

        if (credentials.id) authRequestBody["id"] = credentials.id;
        else if (!credentials.password) throw "USERNAME_AND_PASSWORD_ARE_REQUIRED"; //password is required for all cases except id login (passwordless login)

        if (credentials.username) authRequestBody["username"] = credentials.username;
        if (credentials.email) authRequestBody["email"] = credentials.email;
        if (credentials.phone) authRequestBody["phone"] = credentials.phone;
        authRequestBody["rememberMe"] = credentials.rememberMe === true;

        authRequestBody["device"] = await this.deviceService.getDevice();

        try {
            const auth_token = await httpFetch(this.baseUrl, authRequestBody);

            if (!auth_token) throw "UNDEFINED_TOKEN";
            if ("reset_token" in auth_token) {
                const jwt = this.jwt(auth_token.reset_token);
                if (jwt?.t === "rst") return { type: "reset-pwd", reset_token: auth_token.reset_token };
                else throw "INVALID_TOKEN_TYPE";
            } else {
                const jwt = this.jwt(auth_token.access_token);

                this.setTokens(auth_token);
                this.triggerNext(jwt);
                if (authRequestBody["rememberMe"] !== true) this.setupBeforeUnloadListener();

                return jwt as Principle;
            }
        } catch (error) {
            if (typeof error === "string") throw error;
            // if (error.status) throw error.json()
            if (error.status) throw error.body.code;
            else if (error.status === 0) throw "CONNECTION_ERROR";
            else throw error;
        }
    }

    login(credentials: Credentials & { rememberMe?: boolean }): Promise<{} | Principle> {
        return this.signin(credentials);
    }

    signup(user: any, password: string): Promise<any> {
        const payload = Object.assign(user, { password });
        return httpFetch(this.baseUrl + "/signup", payload);
    }

    forgotPassword(email: string, payload?: any): Promise<any> {
        if (email) {
            payload = payload || {};
            return httpFetch(this.baseUrl + "/forgot-password", { ...payload, email: email.trim().toLocaleLowerCase() });
        } else throw "EMAIL_REQUIRED";
    }

    async reset_password(new_password: string, reset_token: string): Promise<boolean> {
        if (new_password && reset_token) {
            try {
                const response = await httpFetch(this.baseUrl + "/resetpassword", { new_password, reset_token });
                if (response.status === "true") return true;
                else throw response;
            } catch (err) {
                if (err.status) throw await err.json();
                else if (err.status === 0) throw "CONNECTION_ERROR";
                else throw err;
            }
        }
        throw new Error("NEW-PASSWORD_RESET-TOKEN_REQUIRED");
    }

    async sendVerificationCode(name: string, value: string, payload?: any): Promise<boolean> {
        try {
            const post = { name, value, [name]: value, ...payload };
            await firstValueFrom(this.httpAuthorized.post<boolean>(`${this.baseUrl}/verify/send`, post, { headers: { Authorization: `Bearer ${this.get_token()}` } }));
            return true;
        } catch (error) {
            return false;
        }
    }

    async verify(name: string, verification: Verification): Promise<any> {
        const value = verification.value;
        // if (verification.type === 'token') const t = this.jwt(verification.token)

        return firstValueFrom(this.httpAuthorized.post(`${this.baseUrl}/verify`, { name, ...verification }));
    }

    verifyPassword(password: string) {
        return analyzePassword(password);
    }

    async impersonate(sub: string) {
        const impersonation_tokens = await firstValueFrom(this.httpAuthorized.post<{ access_token: string; refresh_token: string }>(`${this.baseUrl}/impersonate`, { sub }));

        //save tokens away
        const original_refresh_token = this.get_refresh_token();
        this.localStorage.setToken(`ORG_${REFRESH_TOKEN}`, original_refresh_token);

        //override current user tokens
        this.setTokens(impersonation_tokens);

        //notify app
        const principle = this.jwt(impersonation_tokens.access_token);
        this.triggerNext(principle);
        return principle;
    }

    unimpersonate() {
        const original_refresh_token = this.localStorage.getToken(`ORG_${REFRESH_TOKEN}`);
        if (original_refresh_token) {
            this.localStorage.removeToken(`ORG_${REFRESH_TOKEN}`);
            return this.refresh(original_refresh_token);
        }
        return null;
    }

    hasRole(role: string) {
        return this.user?.roles?.includes(role);
    }
    hasClaim(claim: string, value?: string) {
        return this.user?.claims?.[claim] === value;
    }
    hasAnyRole(...roles: string[]) {
        return this.user?.roles?.some((role) => roles.includes(role));
    }
}
