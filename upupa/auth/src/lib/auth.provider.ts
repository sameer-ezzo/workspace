import { EnvironmentProviders, InjectionToken, Provider } from "@angular/core";
import { AUTH_OPTIONS } from "./di.token";
import { AuthOptions } from "./auth-options";
import { HTTP_INTERCEPTORS } from "@angular/common/http";
import { AuthInterceptor } from "./auth.interceptor";
import { AUTH_IDPs } from "./idps";

export type EmailAndPasswordProviderOptions = { fields?: any; on_success?: any; on_error?: any };

export const EMAIL_AND_PASSWORD_PROVIDER_OPTIONS = new InjectionToken<EmailAndPasswordProviderOptions>("EMAIL_AND_PASSWORD_PROVIDER_OPTIONS");
export type AuthProvider = Omit<Provider, "provide">;

export function authProviders(options: AuthOptions): Provider[] {
    return [
        { provide: AUTH_OPTIONS, useValue: options },
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    ] as Provider[];
}

//todo: use viewModel to handle the login form

/**
 * Creates an authentication provider that uses a email and password form.
 *
 * @param options - Configuration options for the login form.
 * @param options.fields - The form scheme defining the fields for the login form.
 * @param options.on_success - The callback function to be executed on successful login.
 * @param options.on_error - The callback function to be executed on login error.
 * @returns An AuthProvider object configured with the specified options.
 */
export function withEmailAndPassword(options?: Partial<EmailAndPasswordProviderOptions>): (Provider | EnvironmentProviders)[] {
    return [
        // provideAppInitializer(initGoogleAuth),
        { provide: EMAIL_AND_PASSWORD_PROVIDER_OPTIONS, useValue: options },
        {
            provide: AUTH_IDPs,
            multi: true,
            useValue: { IdpName: "email-and-password", canRender: false },
        },
    ];
}
