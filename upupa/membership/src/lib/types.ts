
import { ActivatedRoute, Router } from "@angular/router";
import { FormScheme } from "@upupa/dynamic-form";
import { LanguageService } from "@upupa/language";
import { defaultForgotPasswordFormFields, defaultLoginFormFields, defaultSignupFormFields, defaultVerifyFormFields } from "./default-values";
import { Condition } from "@noah-ark/expression-engine";
import { AuthService, PasswordStrength } from "@upupa/auth";

export type IdpName = 'google' | 'facebook' | 'github' | 'twitter' | 'linkedin' | 'microsoft' | 'apple';
export type GoogleIDPOptions = {
    clientId: string,
    attributes?: {
        context: "signin",
        callback: "signin",
        nonce: "",
        auto_select: "true" | "false",
        itp_support: "true" | "false"
    } & ({ ux_mode: "popup" } | {
        ux_mode: "redirect"
        login_uri?: string
        scope?: string, //profile email openid
    }),
    customize?: {
        class: "g_id_signin",
        type: "standard",
        size: "large",
        theme: "outline",
        text: "sign_in_with",
        shape: "pill",
        logo_alignment: "left"
    }
}
type MembershipProvider<T = Function> = {
    deps?: any[]
    useFactory: (...args: any[]) => T
}

export type PageNavigationLinkProvider = MembershipProvider<PageNavigationLink[]>
export type InitialValueFactoryProvider = MembershipProvider<(...args: []) => Record<string, unknown>>
export type FormHandlerProvider = MembershipProvider<(...args: []) => void>

export class BaseMembershipFormOptions {
    fields: FormScheme;
    conditions?: Condition[]

    logo?: string
    title?: string
    subTitle?: string
    hostClass?: string

    links?: PageNavigationLinkProvider
    external_links?: PageNavigationLinkProvider
    initial_value_factory?: InitialValueFactoryProvider
    on_success?: FormHandlerProvider
    on_failed?: FormHandlerProvider
}




export const defaultOnSuccessProvider: FormHandlerProvider = {
    deps: [Router, ActivatedRoute, AuthService],
    useFactory: (router: Router, route: ActivatedRoute) => {
        return (...args: []) => {
            const { redirect } = route.snapshot.queryParams;
            if (!redirect) return router.navigateByUrl('/');
            const urlSegments = redirect.split('/').filter(segment => segment);
            return router.navigate(urlSegments);
        };
    }
}
export const defaultSignupOnSuccessProvider = { ...defaultOnSuccessProvider }
export const defaultLoginOnSuccessProvider = { ...defaultOnSuccessProvider }
export const defaultForgotPasswordOnSuccessProvider = { ...defaultOnSuccessProvider }
export const defaultVerifyOnSuccessProvider = { ...defaultOnSuccessProvider }


export const defaultOnFailedProvider: FormHandlerProvider = {
    useFactory: () => {
        return () => {
            return
        }
    }
}

export const defaultSignupOnFailedProvider = { ...defaultOnFailedProvider }
export const defaultLoginOnFailedProvider = { ...defaultOnFailedProvider }
export const defaultForgotPasswordOnFailedProvider = { ...defaultOnFailedProvider }
export const defaultVerifyOnFailedProvider = { ...defaultOnFailedProvider }


export const defaultInitialValueFactoryProvider: InitialValueFactoryProvider = {
    deps: [LanguageService, ActivatedRoute],
    useFactory: (language: LanguageService, route: ActivatedRoute) => {
        return () => {
            const qps = route.snapshot.queryParams;
            return { language: language.language || language.defaultLang, ...qps } as Record<string, unknown>;
        };
    }
}
export const defaultSignupInitialValueFactoryProvider = { ...defaultInitialValueFactoryProvider }
export const defaultLoginFormInitialValueFactoryProvider = { ...defaultInitialValueFactoryProvider }
export const defaultForgotPasswordInitialValueFactoryProvider = { ...defaultInitialValueFactoryProvider }
export const defaultVerifyInitialValueFactoryProvider = { ...defaultInitialValueFactoryProvider }


export const defaultExternalLinksProvider = { useFactory: () => { return [] as PageNavigationLink[] } }
export const defaultSignupExternalLinksProvider = { ...defaultExternalLinksProvider }
export const defaultLoginExternalLinksProvider = { ...defaultExternalLinksProvider }
export const defaultForgotPasswordExternalLinksProvider = { ...defaultExternalLinksProvider }
export const defaultVerifyExternalLinksProvider = { ...defaultExternalLinksProvider }




export const defaultLinksProvider = { useFactory: () => { return [] as PageNavigationLink[] } }
export const defaultVerifyLinksProvider = { ...defaultLinksProvider }


export const defaultSignupLinksProvider = {
    useFactory: (): PageNavigationLink[] => {
        return [{ label: 'Already have an account?', text: 'Sign in', url: `../login` }] as PageNavigationLink[]
    }
}
export const defaultForgotPasswordLinksProvider = { ...defaultSignupLinksProvider }
export const defaultLoginLinksProvider = {
    useFactory: (): PageNavigationLink[] => {
        return [
            { label: 'Forgot password?', text: 'Reset password', url: `../forgot-password` },
            { label: "Don't have account?", text: 'Create new one', url: `../signup` }
        ] as PageNavigationLink[]
    }
}






export class MembershipSignupOptions extends BaseMembershipFormOptions {
    passwordStrength?: PasswordStrength = new PasswordStrength()
    override title = 'Signup'
    override fields: FormScheme = defaultSignupFormFields;
    override links = defaultSignupLinksProvider
    override external_links = defaultSignupExternalLinksProvider
    override on_success = defaultSignupOnSuccessProvider
    override on_failed = defaultSignupOnFailedProvider
    override initial_value_factory = defaultSignupInitialValueFactoryProvider
}
export class MembershipLoginOptions extends BaseMembershipFormOptions {
    override title = 'Sign in'
    override fields: FormScheme = defaultLoginFormFields;

    override links = defaultLoginLinksProvider
    override external_links = defaultLoginExternalLinksProvider
    override on_success = defaultLoginOnSuccessProvider
    override on_failed = defaultLoginOnFailedProvider
    override initial_value_factory = defaultLoginFormInitialValueFactoryProvider
}
export class MembershipForgotPasswordOptions extends BaseMembershipFormOptions {
    override title = 'Forgot password'
    override fields: FormScheme = defaultForgotPasswordFormFields;
    override links = defaultForgotPasswordLinksProvider;
    override external_links = defaultForgotPasswordExternalLinksProvider
    override on_success = defaultForgotPasswordOnSuccessProvider
    override on_failed = defaultForgotPasswordOnFailedProvider
    override initial_value_factory = defaultForgotPasswordInitialValueFactoryProvider

}
export class MembershipVerifyOptions extends BaseMembershipFormOptions {
    override title = 'Verify'
    override fields: FormScheme = defaultVerifyFormFields;
    override links = defaultVerifyLinksProvider
    override external_links = defaultVerifyExternalLinksProvider
    override on_success = defaultVerifyOnSuccessProvider
    override on_failed = defaultVerifyOnFailedProvider
    override initial_value_factory = defaultVerifyInitialValueFactoryProvider
}


export class MembershipOptions {
    hiddenRecaptchaKey?: string;
    recaptchaKey?: string;

    login = new MembershipLoginOptions();
    signup = new MembershipSignupOptions()
    forgotPassword = new MembershipForgotPasswordOptions()
    verify = new MembershipVerifyOptions()
    idPs?: Record<IdpName, any>
}


export type PageNavigationLink = {
    label: string, text: string, url: string, queryParams?: Record<string, string>
}