import { Injectable, inject } from "@angular/core";
import { DeviceService } from "./device.service";
import { AuthApiClient } from "./auth-api.client";
import { Credentials } from "./model";
import { IdPName } from "./idps";
import { Principle, SocialAuthRequest, TokenPairResponse } from "@noah-ark/common";

type RefreshCallbacks = {
	getRefreshToken: () => string | null;
	setRefreshing: (value: boolean) => void;
	setTokens: (tokens: TokenPairResponse | null) => void;
	jwt: (token: string) => Principle | null;
	emitRefreshed: () => void;
	signout: () => Promise<void>;
	triggerNext: (user: Principle | null) => void;
};

type SessionCallbacks = {
	setTokens: (tokens: TokenPairResponse | null) => void;
	clearBeforeUnloadListener: () => void;
	setupBeforeUnloadListener: () => void;
	triggerNext: (user: Principle | null) => void;
	jwt: (token: string) => Principle | null;
	getProviderByName: (provider: IdPName) => { signin: () => Promise<{ credential?: string; token?: string }> };
};

type SignoutCallbacks = {
	setTokens: (tokens: TokenPairResponse | null) => void;
	clearBeforeUnloadListener: () => void;
	triggerNext: (user: Principle | null) => void;
};

@Injectable()
export class SessionOrchestrator {
	private readonly authApi = inject(AuthApiClient);
	private readonly deviceService = inject(DeviceService);

	async refresh(refreshToken: string | undefined, callbacks: RefreshCallbacks): Promise<Principle | null> {
		const nextRefreshToken = refreshToken || callbacks.getRefreshToken() || undefined;
		let principle: Principle | null = null;

		if (!nextRefreshToken) {
			// Keep the current user/session state when no refresh token is available.
			return null;
		}

		try {
			callbacks.setRefreshing(true);
			const tokens = await this.authApi.refresh(nextRefreshToken);
			if (tokens) {
				callbacks.setTokens(tokens);
				principle = callbacks.jwt(tokens.access_token);
				callbacks.emitRefreshed();
				return principle;
			}
		} catch (error) {
			const typedError = error as { status?: number };
			const status = `${typedError.status ?? 0}`;
			if (status.startsWith("4")) {
				if (!principle) {
					console.warn("SIGNING OUT: ", error);
					await callbacks.signout();
				} else {
					callbacks.triggerNext(principle);
				}
			} else if (status === "0") {
				console.warn("Network error: ", error);
			} else {
				console.error("Error refreshing token: ", error);
			}
			return principle;
		} finally {
			callbacks.setRefreshing(false);
		}

		callbacks.triggerNext(principle);
		return principle;
	}

	async signinGoogle(user: SocialAuthRequest & { token: string }, callbacks: SessionCallbacks): Promise<Principle | null> {
		const response = await this.authApi.signinGoogle(user);
		return this.applyTokenPair(response, callbacks, true);
	}

	async signinFacebook(user: SocialAuthRequest & { token: string }, callbacks: SessionCallbacks): Promise<Principle | null> {
		const response = await this.authApi.signinFacebook(user);
		return this.applyTokenPair(response, callbacks, true);
	}

	async signinWithProvider<Name extends IdPName>(provider: Name, callbacks: SessionCallbacks): Promise<Principle | { type: "reset-pwd"; reset_token: string } | null> {
		const idp = callbacks.getProviderByName(provider);

		try {
			const session = await idp.signin();
			const credential = session.credential ?? session.token;
			if (!credential) throw new Error("UNDEFINED_CREDENTIAL");
			const authToken = await this.authApi.signinProvider(provider, credential);

			if (!authToken) throw new Error("UNDEFINED_TOKEN");
			if ("reset_token" in authToken) {
				const jwt = callbacks.jwt(authToken.reset_token);
				if (jwt?.["t"] === "rst") return { type: "reset-pwd", reset_token: authToken.reset_token };
				throw new Error("INVALID_TOKEN_TYPE");
			}

			return this.applyTokenPair(authToken, callbacks, true);
		} catch (error) {
			console.log(error);
		}

		return null;
	}

	async signin(credentials: Credentials & { rememberMe?: boolean }, callbacks: SessionCallbacks): Promise<Principle | { type: "reset-pwd"; reset_token: string }> {
		const authRequestBody: Record<string, unknown> = {
			grant_type: "password",
			rememberMe: false,
			password: credentials.password,
			device: undefined,
		};

		if (credentials.id) authRequestBody["id"] = credentials.id;
		else if (!credentials.password) throw new Error("USERNAME_AND_PASSWORD_ARE_REQUIRED");

		if (credentials.username) authRequestBody["username"] = credentials.username;
		if (credentials.email) authRequestBody["email"] = credentials.email;
		if (credentials.phone) authRequestBody["phone"] = credentials.phone;
		authRequestBody["rememberMe"] = credentials.rememberMe === true;

		try {
			authRequestBody["device"] = await this.deviceService.getDevice();
		} catch (error) {
			console.error(error);
		}

		const authToken = await this.authApi.signin(authRequestBody);
		if (!authToken) throw new Error("UNDEFINED_TOKEN");
		if ("reset_token" in authToken) {
			const jwt = callbacks.jwt(authToken.reset_token);
			if (jwt?.["t"] === "rst") return { type: "reset-pwd", reset_token: authToken.reset_token };
			throw new Error("INVALID_TOKEN_TYPE");
		}

		const rememberMe = authRequestBody["rememberMe"] === true;
		return this.applyTokenPair(authToken, callbacks, rememberMe, !rememberMe);
	}

	async signout(callbacks: SignoutCallbacks): Promise<void> {
		try {
			const { success } = await this.authApi.signout();
			if (!success) throw new Error("SIGNOUT_FAILED");
			callbacks.clearBeforeUnloadListener();
			callbacks.setTokens(null);
			callbacks.triggerNext(null);
		} catch (error) {
			console.error("Error signing out: ", error);
		}
	}

	private applyTokenPair(
		response: TokenPairResponse,
		callbacks: SessionCallbacks,
		clearBeforeUnloadListener: boolean,
		setupBeforeUnloadListener = false,
	): Principle | null {
		const principle = callbacks.jwt(response.access_token);
		callbacks.setTokens(response);
		if (clearBeforeUnloadListener) callbacks.clearBeforeUnloadListener();
		if (setupBeforeUnloadListener) callbacks.setupBeforeUnloadListener();
		callbacks.triggerNext(principle);
		return principle;
	}
}
