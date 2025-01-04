import { EnvironmentProviders, InjectionToken, makeEnvironmentProviders, Provider } from "@angular/core";
import { AuthOptions } from "../auth-options";
import { GoogleIDPOptions } from "./google/google.idp";
import { AuthProvider, authProviders } from "../auth.provider";
import { FacebookIDPOptions } from "./facebook/facebook.idp";
import { DynamicComponent } from "@upupa/common";

export type IdPName = "google" | "facebook" | "github" | "twitter" | "linkedin" | "microsoft" | "apple" | "email-and-password";

export type IdPsOptions<Name extends IdPName = "email-and-password"> = { name: Name; options: unknown } & (Name extends "google"
    ? { options: GoogleIDPOptions }
    : Name extends "facebook"
      ? { options: FacebookIDPOptions }
      : { options: unknown });

export type IdPOptions<Name extends IdPName> = Partial<IdPsOptions<Name>> & { on_success?: any; on_error?: any };

export const AUTH_IDPs = new InjectionToken<{ name: IdPName; template: DynamicComponent }[]>("AUTH_IDPs");

export function provideAuth(options: Partial<AuthOptions>, ...features: AuthProvider[]): EnvironmentProviders {
    const providers = features.map((feature) => ({ ...feature, provide: AUTH_IDPs, multi: true }) as Provider);
    return makeEnvironmentProviders([...authProviders(options), ...providers]);
}
