import { Provider } from "@angular/core";
import { AUTH_OPTIONS } from "./di.token";
import { AuthOptions } from "./auth-options";
import { HTTP_INTERCEPTORS } from "@angular/common/http";
import { AuthInterceptor } from "./auth.interceptor";
import { FormScheme } from "@upupa/dynamic-form";
import { defaultLoginFormFields, LoginFormComponent } from "@upupa/membership";
import { ActivatedRoute, Router } from "@angular/router";
import { SnackBarService } from "@upupa/dialog";
import { DynamicComponent } from "@upupa/common";

export type AuthProvider = Omit<Provider, "provide">;

export function authProviders(options: AuthOptions): Provider[] {
    return [
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
        { provide: AUTH_OPTIONS, useValue: options },
    ] as Provider[];
}

export function default_success_login(instance, response) {
    const router = instance.injector.get(Router);
    const route = instance.injector.get(ActivatedRoute);
    const { redirect, redirectTo } = route.snapshot.queryParams ?? {};
    const redirectUrl = redirect ?? redirectTo ?? "/";
    router.navigateByUrl(decodeURIComponent(redirectUrl));
}

export function default_error_login(instance, error) {
    instance.injector.get(SnackBarService).openFailed(error.message);
}

const defaultUsernameAndPasswordOptions = {
    fields: defaultLoginFormFields,
    on_success: default_success_login,
    on_error: default_error_login,
};
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
export function withEmailAndPassword(options: { fields?: FormScheme; on_success?: any; on_error?: any } = defaultUsernameAndPasswordOptions): AuthProvider {
    options.fields = options.fields ?? defaultLoginFormFields;
    options.on_success = options.on_success ?? default_success_login;
    options.on_error = options.on_error ?? default_error_login;
    return {
        useValue: {
            name: "email-and-password",
            template: {
                component: LoginFormComponent,
                content: [[`<h3 class="header">Login</h3>`]],
                inputs: {
                    fields: options.fields,
                },
                outputs: {
                    success: options.on_success,
                    error: options.on_error,
                },
            } as DynamicComponent<LoginFormComponent>,
        },
    } as AuthProvider;
}
