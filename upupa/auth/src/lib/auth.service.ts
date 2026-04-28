import { Injectable, PLATFORM_ID, REQUEST, Signal, inject, DOCUMENT, makeStateKey, TransferState, signal } from "@angular/core";
import { ReplaySubject, interval, Subject } from "rxjs";
import { delayWhen } from "rxjs/operators";
import { AUTH_OPTIONS } from "./di.token";
import { HttpRequest } from "@angular/common/http";
import { Credentials, Verification } from "./model";
import { Router } from "@angular/router";
import { analyzePassword, MutexAsync, Principle, SocialAuthRequest, TokenPairResponse } from "@noah-ark/common";

import { DeviceService } from "./device.service";
import { isPlatformBrowser } from "@angular/common";
import { AUTH_IDPs, AuthIdProvider, IdPName } from "./idps";
import { toSignal } from "@angular/core/rxjs-interop";
import { AuthApiClient } from "./auth-api.client";
import { SessionOrchestrator } from "./session-orchestrator";

export const ACCESS_TOKEN = "token";
export const REFRESH_TOKEN = "refresh_token";
export const AUTH_STATE_KEY = makeStateKey<{ access_token: string; refresh_token: string; user: Principle }>("AUTH_STATE");

export interface TokenStore {
    getToken(key: string): string;
    setToken(key: string, value: string): void;
    removeToken(key: string): void;

    getAccessToken(): string;
    getRefreshToken(): string;

    setAccessToken(access_token: string): void;
    setRefreshToken(refresh_token: string): void;

    removeRefreshToken(): void;
    removeAccessToken(): void;
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
    setAccessToken(access_token: string): void {
        this.setToken(ACCESS_TOKEN, access_token);
    }
    setRefreshToken(refresh_token: string): void {
        this.setToken(REFRESH_TOKEN, refresh_token);
    }
    removeAccessToken(): void {
        this.removeToken(ACCESS_TOKEN);
    }
    removeRefreshToken(): void {
        this.removeToken(REFRESH_TOKEN);
    }
}

export class RequestTokenStore implements TokenStore {
    req = inject(REQUEST);
    store = new Map<string, unknown>();
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
        this.store.set(key, value);
    }
    removeToken(key: string): void {
        this.store.delete(key);
    }

    removeRefreshToken(): void {
        this.removeToken(REFRESH_TOKEN);
    }
    removeAccessToken(): void {
        this.removeToken(ACCESS_TOKEN);
    }
    setAccessToken(access_token: string): void {
        this.setToken(ACCESS_TOKEN, access_token);
    }
    setRefreshToken(refresh_token: string): void {
        this.setToken(REFRESH_TOKEN, refresh_token);
    }
}

@Injectable()
export class AuthService {
    isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
    refreshed$ = new Subject<number>();
    private _user$ = new ReplaySubject<Principle | null>(1);
    user$ = this._user$.asObservable();
    userSignal: Signal<Principle | null> = toSignal(this._user$, { initialValue: null });
    user: Principle | null = null;
    private readonly transferState = inject(TransferState); // use this to transfer authenticated user in ssr to client
    refreshing = signal(false);
    private _token$ = new Subject<string | null>();
    token$ = this._token$.asObservable();

    private readonly localStorage: TokenStore = this.isBrowser ? new LocalStorageTokenStore() : new RequestTokenStore();

    public readonly options = inject(AUTH_OPTIONS, { optional: false });
    public readonly baseUrl = this.options.baseUrl;

    readonly authIdPs: AuthIdProvider[] = inject(AUTH_IDPs, { optional: true }) ?? [];
    get IdProviders(): IdPName[] {
        return this.authIdPs.map((x) => x.IdpName).filter((x): x is IdPName => !!x);
    }
    getProviderByName(providerName: IdPName): AuthIdProvider {
        const idp = this.authIdPs.find((x) => x.IdpName === providerName);
        if (!idp) throw new Error(`Provider ${providerName} not found`);
        return idp;
    }

    public readonly router = inject(Router);
    public readonly deviceService = inject(DeviceService);
    private readonly authApi = inject(AuthApiClient);
    private readonly sessionOrchestrator = inject(SessionOrchestrator);

    get passwordPolicy() {
        return Object.freeze(this.options.passwordPolicy);
    }

    constructor() {
        const user = this.jwt(this.get_token());

        this.triggerNext(user);

        if (this.isBrowser) {
            //auto refresh identity
            this.refreshed$.pipe(delayWhen(() => interval(1000 * 60 * 15))).subscribe(() => this.refresh());
            this.refresh();
        }
    }

    fromCookies(req: Request | HttpRequest<unknown> | null): Principle | null {
        if (!req) {
            console.warn("No request object provided");
            return null;
        }
        const cookies = req.headers.get("cookie");

        if (cookies) {
            // Parse the cookies to find 'ssr_jwt' this could be variable! find a way to configure it or get it from the server
            const parsedCookies = cookies
                .split(";")
                .map((s) => s.trim())
                .reduce(
                    (acc, current) => {
                        const [key, value] = current.split("=");
                        acc[key] = value;
                        return acc;
                    },
                    {} as Record<string, string>,
                );

            const cookieName = (this.options as { useCookies?: { cookieName?: string } })?.useCookies?.cookieName ?? "ssr_jwt";
            const fallbackCookie = parsedCookies["ssr_jwt"] || parsedCookies["auth"] || "{}";
            const { access_token, refresh_token } = JSON.parse(decodeURIComponent(parsedCookies[cookieName] || fallbackCookie)) as { access_token?: string; refresh_token?: string };

            if (!access_token) return this.user;
            this._access_token = access_token;
            this._refresh_token = refresh_token ?? null;
            this.triggerNext(this.jwt(access_token));
        }

        return this.user;
    }

    private readonly doc = inject(DOCUMENT);
    private beforeUnloadHandler?: (event: BeforeUnloadEvent) => void;

    private clearBeforeUnloadListener(): void {
        if (!this.beforeUnloadHandler) return;

        this.doc.defaultView?.removeEventListener("beforeunload", this.beforeUnloadHandler);
        this.beforeUnloadHandler = undefined;
    }

    private setupBeforeUnloadListener(): void {
        if (this.beforeUnloadHandler) return;

        console.warn("User Tokens will be removed on page refresh");
        this.beforeUnloadHandler = () => {
            this.setTokens(null);
        };
        this.doc.defaultView?.addEventListener("beforeunload", this.beforeUnloadHandler);
    }
    private _access_token: string | null = null;
    get access_token() {
        return this._access_token;
    }
    private _refresh_token: string | null = null;
    get refresh_token() {
        return this._refresh_token;
    }

    private triggerNext(user: Principle | null): void {
        if (user) {
            const mutable = user as Principle & { emv?: number; phv?: number; emailVerified?: boolean; phoneVerified?: boolean };
            mutable.emailVerified = mutable.emv === 1 || mutable.emailVerified === true;
            mutable.phoneVerified = mutable.phv === 1 || mutable.phoneVerified === true;
            delete mutable.emv;
            delete mutable.phv;
        }

        this.user = user;
        this._user$.next(user);
        //todo connected to /api/user as ws to fetch/subscribe to user changes
    }

    get_token() {
        return this.transferState.get(AUTH_STATE_KEY, null)?.access_token ?? this._access_token ?? this.localStorage.getAccessToken();
    }
    get_refresh_token() {
        return this.transferState.get(AUTH_STATE_KEY, null)?.refresh_token ?? this._refresh_token ?? this.localStorage.getRefreshToken();
    }

    jwt(tokenString: string): Principle | null {
        try {
            const base64Url = tokenString.split(".")[1];
            const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

            // Decode base64 and properly handle UTF-8 characters
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split("")
                    .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                    .join(""),
            );

            const token = JSON.parse(jsonPayload) as Principle & { exp?: number };

            const now = new Date();
            const expire = new Date((token.exp ?? 0) * 1000);
            if (now > expire) return null;
            return token;
        } catch {
            return null;
        }
    }
    async signout() {
        return this.sessionOrchestrator.signout({
            setTokens: (tokens) => this.setTokens(tokens),
            clearBeforeUnloadListener: () => this.clearBeforeUnloadListener(),
            triggerNext: (user) => this.triggerNext(user),
        });
    }

    async checkUser(usernameOrEmailOrPhone: string): Promise<{ canLogin: boolean } & Record<string, unknown>> {
        return this.authApi.checkUser(usernameOrEmailOrPhone);
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
        const current = this.jwt(this.get_token());
        const next = await this.sessionOrchestrator.refresh(refresh_token, {
            getRefreshToken: () => this.get_refresh_token(),
            setRefreshing: (value) => this.refreshing.set(value),
            setTokens: (tokens) => this.setTokens(tokens),
            jwt: (token) => this.jwt(token),
            emitRefreshed: () => this.refreshed$.next(Date.now()),
            signout: () => this.signout(),
            triggerNext: (user) => this.triggerNext(user),
        });

        if (!next && current) {
            this.triggerNext(current);
            return current;
        }

        return next;
    }

    private setTokens(tokens: TokenPairResponse | null): void {
        if (tokens) {
            this._access_token = tokens.access_token;
            this._refresh_token = tokens.refresh_token;
            this.localStorage.setAccessToken(this._access_token);
            this.localStorage.setRefreshToken(this._refresh_token);
        } else {
            this.localStorage.removeAccessToken();
            this.localStorage.removeRefreshToken();
        }
        this._token$.next(this._access_token);
    }
    async signin_Google(user: SocialAuthRequest & { token: string }) {
        return this.sessionOrchestrator.signinGoogle(user, {
            setTokens: (tokens) => this.setTokens(tokens),
            clearBeforeUnloadListener: () => this.clearBeforeUnloadListener(),
            setupBeforeUnloadListener: () => this.setupBeforeUnloadListener(),
            triggerNext: (principle) => this.triggerNext(principle),
            jwt: (token) => this.jwt(token),
            getProviderByName: (provider) => this.getProviderByName(provider),
        });
    }

    async signin_Facebook(user: SocialAuthRequest & { token: string }) {
        return this.sessionOrchestrator.signinFacebook(user, {
            setTokens: (tokens) => this.setTokens(tokens),
            clearBeforeUnloadListener: () => this.clearBeforeUnloadListener(),
            setupBeforeUnloadListener: () => this.setupBeforeUnloadListener(),
            triggerNext: (principle) => this.triggerNext(principle),
            jwt: (token) => this.jwt(token),
            getProviderByName: (provider) => this.getProviderByName(provider),
        });
    }

    async signinWithProvider<Name extends IdPName>(provider: Name): Promise<Principle | { type: "reset-pwd"; reset_token: string } | null> {
        return this.sessionOrchestrator.signinWithProvider(provider, {
            setTokens: (tokens) => this.setTokens(tokens),
            clearBeforeUnloadListener: () => this.clearBeforeUnloadListener(),
            setupBeforeUnloadListener: () => this.setupBeforeUnloadListener(),
            triggerNext: (principle) => this.triggerNext(principle),
            jwt: (token) => this.jwt(token),
            getProviderByName: (providerName) => this.getProviderByName(providerName),
        });
    }
    async signin(credentials: Credentials & { rememberMe?: boolean }): Promise<Principle | { type: "reset-pwd"; reset_token: string }> {
        return this.sessionOrchestrator.signin(credentials, {
            setTokens: (tokens) => this.setTokens(tokens),
            clearBeforeUnloadListener: () => this.clearBeforeUnloadListener(),
            setupBeforeUnloadListener: () => this.setupBeforeUnloadListener(),
            triggerNext: (principle) => this.triggerNext(principle),
            jwt: (token) => this.jwt(token),
            getProviderByName: (provider) => this.getProviderByName(provider),
        });
    }

    signup(user: Record<string, unknown>, password: string): Promise<Record<string, unknown>> {
        return this.authApi.signup(user, password);
    }

    forgotPassword(email: string, payload?: Record<string, unknown>): Promise<Record<string, unknown>> {
        if (email) {
            return this.authApi.forgotPassword(email, payload);
        } else throw "EMAIL_REQUIRED";
    }

    async sendVerificationCode(name: string, value: string, payload?: Record<string, unknown>): Promise<boolean> {
        try {
            return await this.authApi.sendVerificationCode(name, value, payload);
        } catch {
            return false;
        }
    }

    async verify(name: string, verification: Verification): Promise<unknown> {
        // if (verification.type === 'token') const t = this.jwt(verification.token)

        return this.authApi.verify(name, verification);
    }

    verifyPassword(password: string) {
        return analyzePassword(password);
    }

    async impersonate(sub: string) {
        //save tokens away
        const original_refresh_token = this.get_refresh_token();
        this.localStorage.setToken(`ORG_${REFRESH_TOKEN}`, original_refresh_token);

        try {
            const impersonation_tokens = await this.authApi.impersonate(sub);
            //override current user tokens
            this.setTokens(impersonation_tokens);

            //notify app
            const principle = this.jwt(impersonation_tokens.access_token);
            this.triggerNext(principle);
            return principle;
        } catch {
            this.localStorage.removeToken(`ORG_${original_refresh_token}`);
            return this.user;
        }
    }

    async unimpersonate() {
        const original_refresh_token = this.localStorage.getToken(`ORG_${REFRESH_TOKEN}`);
        if (original_refresh_token) {
            this._access_token = null;
            this._refresh_token = original_refresh_token;
            const res = await this.refresh(original_refresh_token);
            this.localStorage.removeToken(`ORG_${REFRESH_TOKEN}`);
            return res;
        } else {
            // when no ORG_TOKEN unimpersonate equals signout
            this.signout();
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
