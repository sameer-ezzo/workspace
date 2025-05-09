import { FormScheme, reflectFormViewModelType } from "@upupa/dynamic-form";
import { defaultForgotPasswordFormFields, defaultResetPasswordFormFields, defaultSignupFormFields, defaultVerifyFormFields, LoginFormViewModel } from "./default-values";
import { Condition } from "@noah-ark/expression-engine";
import { ComponentRef, inject } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { SnackBarService } from "@upupa/dialog";
import { Router } from "@angular/router";
import { PasswordStrength } from "@noah-ark/common";
import { LocationStrategy } from "@angular/common";

export type IdpName = "google" | "facebook" | "github" | "twitter" | "linkedin" | "microsoft" | "apple";
export type GoogleIDPOptions = {
    clientId: string;
    attributes?: {
        context: "signin";
        callback: "signin";
        nonce: "";
        auto_select: "true" | "false";
        itp_support: "true" | "false";
    } & (
        | { ux_mode: "popup" }
        | {
              ux_mode: "redirect";
              login_uri?: string;
              scope?: string; //profile email openid
          }
    );
    customize?: {
        class: "g_id_signin";
        type: "standard";
        size: "large";
        theme: "outline";
        text: "sign_in_with";
        shape: "pill";
        logo_alignment: "left";
    };
};
export type Idp =
    | { name: "google"; options: GoogleIDPOptions }
    | { name: "facebook"; options: unknown }
    | { name: "github"; options: unknown }
    | { name: "twitter"; options: unknown }
    | { name: "linkedin"; options: unknown }
    | { name: "microsoft"; options: unknown }
    | { name: "apple"; options: unknown };

export type FormHandler<T = any> = (instance: ComponentRef<T>["instance"], ...args: any[]) => Promise<void> | void;

export class BaseMembershipFormOptions {
    hostClass?: string;

    fields: FormScheme;
    conditions?: Condition[];

    // these handler are called inside injected context
    on_success?: FormHandler;
    on_error?: FormHandler;

    constructor(fields?: FormScheme, conditions?: Condition[], on_success?: FormHandler, on_error?: FormHandler) {
        this.fields = fields ?? {};
        this.conditions = conditions ?? [];
        this.on_success = on_success;
        this.on_error = on_error;
    }
}

export class MembershipSignupOptions extends BaseMembershipFormOptions {
    passwordStrength?: PasswordStrength = new PasswordStrength();
    constructor(fields?: FormScheme, conditions?: Condition[], on_success?: FormHandler, on_error?: FormHandler) {
        super(fields ?? defaultSignupFormFields, conditions, on_success ?? ((ref) => {}), on_error ?? ((ref) => {}));
    }
}

export function loginSuccessHandler(instance, response) {
    const router = inject(Router);
    const route = inject(ActivatedRoute);
    const base_url = inject(LocationStrategy).getBaseHref();
    const { redirect, redirectTo } = route.snapshot.queryParams ?? {};
    const redirectUrl = redirect ?? redirectTo ?? base_url;
    router.navigateByUrl(decodeURIComponent(redirectUrl));
}

export function loginErrorHandler(instance, error) {
    const snack = inject(SnackBarService);
    snack.openFailed(error.message);
}
export class MembershipLoginOptions extends BaseMembershipFormOptions {
    constructor(fields?: FormScheme, conditions?: Condition[], on_success?: FormHandler, on_error?: FormHandler) {
        const { fields: fs, conditions: cnds } = reflectFormViewModelType(LoginFormViewModel);
        on_success = on_success ?? loginSuccessHandler;
        on_error = on_error ?? loginErrorHandler;
        super(fields ?? fs, conditions ?? cnds, on_success, on_error);
    }
}

export function forgotPasswordSuccessHandler(instance, response) {
    const snack = inject(SnackBarService);
    snack.openSuccess(`Reset password link sent to ${response.email}`);
    const router = inject(Router);
    router.navigate(["/"]);
}

export function forgotPasswordErrorHandler(instance, error) {
    const snack = inject(SnackBarService);
    const router = inject(Router);
    const route = inject(ActivatedRoute);
    snack
        .openFailed(error.message)
        .afterDismissed()
        .subscribe(() => {
            router.navigate(["/"], { relativeTo: route });
        });
}
export class MembershipForgotPasswordOptions extends BaseMembershipFormOptions {
    constructor(fields?: FormScheme, conditions?: Condition[], on_success?: FormHandler, on_error?: FormHandler) {
        on_success = on_success ?? forgotPasswordSuccessHandler;
        on_error = on_error ?? forgotPasswordErrorHandler;
        super(fields ?? defaultForgotPasswordFormFields, conditions, on_success, on_error);
    }
}

export class MembershipResetPasswordOptions extends BaseMembershipFormOptions {
    constructor(fields?: FormScheme, conditions?: Condition[], on_success?: FormHandler, on_error?: FormHandler) {
        super(fields ?? defaultResetPasswordFormFields, conditions, on_success ?? ((ref) => {}), on_error ?? ((ref) => {}));
    }
}
export class MembershipVerifyOptions extends BaseMembershipFormOptions {
    constructor(fields?: FormScheme, conditions?: Condition[], on_success?: FormHandler, on_error?: FormHandler) {
        super(fields ?? defaultVerifyFormFields, conditions, on_success ?? ((ref) => {}), on_error ?? ((ref) => {}));
    }
}

export class MembershipOptions {
    hiddenRecaptchaKey?: string;
    recaptchaKey?: string;

    login = new MembershipLoginOptions();
    signup = new MembershipSignupOptions();
    forgotPassword?: MembershipForgotPasswordOptions = new MembershipForgotPasswordOptions();
    resetPassword?: MembershipResetPasswordOptions = new MembershipResetPasswordOptions();
    verify = new MembershipVerifyOptions();
    idPs?: Partial<Record<IdpName, any>>;
}

export type PageNavigationLink = {
    label: string;
    text: string;
    url: string;
    queryParams?: Record<string, string>;
};
