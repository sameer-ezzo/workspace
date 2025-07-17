import { EnvironmentProviders, inject, InjectionToken, makeEnvironmentProviders, provideAppInitializer, Provider } from "@angular/core";
import { AuthOptions } from "../auth-options";
import { GoogleIdProviderOptions } from "./google/google.idp";
import { authProviders } from "../auth.provider";
import { FacebookIdProviderOptions } from "./facebook/facebook.idp";
import { IdProviderService } from "./google/google-id-provider.service";
import { provideHttpClient, withFetch, withInterceptors } from "@angular/common/http";
import { AuthInterceptor } from "../auth.interceptor";
import { AuthService } from "../auth.service";

export type IdPName = "google" | "facebook" | "github" | "twitter" | "linkedin" | "microsoft" | "apple" | "email-and-password" | "username-and-password";

export type IdPsOptions<Name extends IdPName = "email-and-password"> = { name: Name; options: unknown } & (Name extends "google"
    ? { options: GoogleIdProviderOptions }
    : Name extends "facebook"
      ? { options: FacebookIdProviderOptions }
      : { options: unknown });

export type IdProviderOptions<Name extends IdPName> = Partial<IdPsOptions<Name>> & {
    on_success?: (instance: any, value: any) => void;
    on_error?: (instance: any, error: any) => void;
};
export type AuthIdProvider<Name extends IdPName = IdPName> = IdProviderService<Name>;
export const AUTH_IDPs = new InjectionToken<AuthIdProvider[]>("AUTH_IdPs");

export function provideAuth(options: (() => Partial<AuthOptions>) | Partial<AuthOptions>, ...features: (Provider | EnvironmentProviders)[][]): EnvironmentProviders {
    const providers = features.flat();

    const opts = typeof options === "function" ? options : () => options;
    // if (!options.base_url) throw new Error("Base URL must be provided in AuthOptions");

    return makeEnvironmentProviders([
        ...authProviders(opts),
        ...providers,
        provideHttpClient(withFetch(), withInterceptors([AuthInterceptor])),
        // provideAppInitializer(async () => {
        //     const auth = inject(AuthService);
        //     await auth.refresh();
        // }),
    ]);
}
