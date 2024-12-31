import { ActivatedRoute, Router } from "@angular/router";
import { FormScheme, reflectFormViewModelType } from "@upupa/dynamic-form";
import { LanguageService } from "@upupa/language";
import { defaultForgotPasswordFormFields, defaultSignupFormFields, defaultVerifyFormFields, LoginFormViewModel } from "./default-values";
import { Condition } from "@noah-ark/expression-engine";
import { AuthService, PasswordStrength } from "@upupa/auth";

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
type MembershipProvider<T = Function> = {
    deps?: any[];
    useFactory: (...args: any[]) => T;
};

export type PageNavigationLinkProvider = MembershipProvider<PageNavigationLink[]>;
export type InitialValueFactoryProvider = MembershipProvider<(...args: []) => Record<string, unknown>>;
export type FormHandlerProvider = MembershipProvider<(...args: []) => void>;

export class BaseMembershipFormOptions {
    hostClass?: string;

    fields: FormScheme;
    conditions?: Condition[];
}

export const defaultOnSuccessProvider: FormHandlerProvider = {
    deps: [Router, ActivatedRoute, AuthService],
    useFactory: (router: Router, route: ActivatedRoute) => {
        return (...args: []) => {
            const { redirect } = route.snapshot.queryParams;
            if (!redirect) return router.navigateByUrl("/");
            const urlSegments = redirect.split("/").filter((segment) => segment);
            return router.navigate(["/", ...urlSegments]);
        };
    },
};
export const defaultSignupOnSuccessProvider = { ...defaultOnSuccessProvider };
export const defaultLoginOnSuccessProvider = { ...defaultOnSuccessProvider };
export const defaultForgotPasswordOnSuccessProvider = {
    ...defaultOnSuccessProvider,
};
export const defaultVerifyOnSuccessProvider = { ...defaultOnSuccessProvider };

export const defaultOnFailedProvider: FormHandlerProvider = {
    useFactory: () => {
        return () => {
            return;
        };
    },
};

export const defaultSignupOnFailedProvider = { ...defaultOnFailedProvider };
export const defaultLoginOnFailedProvider = { ...defaultOnFailedProvider };
export const defaultForgotPasswordOnFailedProvider = {
    ...defaultOnFailedProvider,
};
export const defaultVerifyOnFailedProvider = { ...defaultOnFailedProvider };

export const defaultInitialValueFactoryProvider: InitialValueFactoryProvider = {
    deps: [LanguageService, ActivatedRoute],
    useFactory: (language: LanguageService, route: ActivatedRoute) => {
        return () => {
            const qps = route.snapshot.queryParams;
            return {
                language: language.language || language.defaultLang,
                ...qps,
            } as Record<string, unknown>;
        };
    },
};
export const defaultSignupInitialValueFactoryProvider = {
    ...defaultInitialValueFactoryProvider,
};
export const defaultLoginFormInitialValueFactoryProvider = {
    ...defaultInitialValueFactoryProvider,
};
export const defaultForgotPasswordInitialValueFactoryProvider = {
    ...defaultInitialValueFactoryProvider,
};
export const defaultVerifyInitialValueFactoryProvider = {
    ...defaultInitialValueFactoryProvider,
};

export const defaultExternalLinksProvider = {
    useFactory: () => {
        return [] as PageNavigationLink[];
    },
};
export const defaultSignupExternalLinksProvider = {
    ...defaultExternalLinksProvider,
};
export const defaultLoginExternalLinksProvider = {
    ...defaultExternalLinksProvider,
};
export const defaultForgotPasswordExternalLinksProvider = {
    ...defaultExternalLinksProvider,
};
export const defaultVerifyExternalLinksProvider = {
    ...defaultExternalLinksProvider,
};

export const defaultLinksProvider = {
    useFactory: () => {
        return [] as PageNavigationLink[];
    },
};

export class MembershipSignupOptions extends BaseMembershipFormOptions {
    passwordStrength?: PasswordStrength = new PasswordStrength();
    override fields: FormScheme = defaultSignupFormFields;
    // override links = defaultSignupLinksProvider;
    // override external_links = defaultSignupExternalLinksProvider;
    // override on_success = defaultSignupOnSuccessProvider;
    // override on_failed = defaultSignupOnFailedProvider;
    // override initial_value_factory = defaultSignupInitialValueFactoryProvider;
}
export class MembershipLoginOptions extends BaseMembershipFormOptions {
    override fields: FormScheme = reflectFormViewModelType(LoginFormViewModel).fields;

    on_success = defaultLoginOnSuccessProvider;
    on_failed = defaultLoginOnFailedProvider;

    // override links = defaultLoginLinksProvider;
    // override external_links = defaultLoginExternalLinksProvider;

    // override initial_value_factory = defaultLoginFormInitialValueFactoryProvider;
}
export class MembershipForgotPasswordOptions extends BaseMembershipFormOptions {
    override fields: FormScheme = defaultForgotPasswordFormFields;
    on_success = defaultForgotPasswordOnSuccessProvider;
    on_failed = defaultForgotPasswordOnFailedProvider;
    // override links = defaultForgotPasswordLinksProvider;
    // override external_links = defaultForgotPasswordExternalLinksProvider;
    // override initial_value_factory = defaultForgotPasswordInitialValueFactoryProvider;
}
export class MembershipVerifyOptions extends BaseMembershipFormOptions {
    override fields: FormScheme = defaultVerifyFormFields;
    // override links = defaultVerifyLinksProvider;
    // override external_links = defaultVerifyExternalLinksProvider;
    // override on_success = defaultVerifyOnSuccessProvider;
    // override on_failed = defaultVerifyOnFailedProvider;
    // override initial_value_factory = defaultVerifyInitialValueFactoryProvider;
}

export class MembershipOptions {
    hiddenRecaptchaKey?: string;
    recaptchaKey?: string;

    login = new MembershipLoginOptions();
    signup = new MembershipSignupOptions();
    forgotPassword?: MembershipForgotPasswordOptions = new MembershipForgotPasswordOptions();
    verify = new MembershipVerifyOptions();
    idPs?: Record<IdpName, any>;
}

export type PageNavigationLink = {
    label: string;
    text: string;
    url: string;
    queryParams?: Record<string, string>;
};
