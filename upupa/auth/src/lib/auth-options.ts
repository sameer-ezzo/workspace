import { Provider } from '@angular/core';
import { DEFAULT_LOGIN_PROVIDER_TOKEN, DEFAULT_REDIRECT_PROVIDER_TOKEN, DEFAULT_VERIFY_PROVIDER_TOKEN } from './di.token';
import { ActivatedRoute, Router } from '@angular/router';
import { LanguageService } from '@upupa/language';
import { PasswordStrength } from './password-strength-policy';


const logInProvider: Provider = {
    provide: DEFAULT_LOGIN_PROVIDER_TOKEN, useFactory: (route: ActivatedRoute) => {
        // get path from route as string
        const url = route.snapshot.url.toString()
        const red = url.length > 0 ? `?redirect=${url}` : ''

        return `/login${red}`
    }, deps: [LanguageService, ActivatedRoute]
}
const verifyProvider: Provider = {
    provide: DEFAULT_VERIFY_PROVIDER_TOKEN, useFactory: (route: ActivatedRoute) => {
        const url = route.snapshot.url.toString()
        const red = url.length > 0 ? `?redirect=${url}` : ''
        return `/verify${red}`
    }, deps: [LanguageService, ActivatedRoute]
}

const forbiddenProvider: Provider = {
    provide: DEFAULT_VERIFY_PROVIDER_TOKEN, useFactory: (route: ActivatedRoute) => {
        const url = route.snapshot.url.toString()
        const red = url.length > 0 ? `?redirect=${url}` : ''
        return `/${red}`
    }, deps: [LanguageService, ActivatedRoute]
}




export class AuthOptions {
    auth_base_url?: string | Provider = '/auth'
    password_policy?: PasswordStrength = new PasswordStrength()
    default_login_url?: string | Provider = logInProvider
    default_forbidden_url?: string | Provider = forbiddenProvider
    default_verify_url?: string | Provider = verifyProvider
    redirect_url?: string | Provider = {
        provide: DEFAULT_REDIRECT_PROVIDER_TOKEN,
        deps: [ActivatedRoute, Router],
        useFactory: (route: ActivatedRoute, router: Router) => {
            return () => {
                const redirect = route.snapshot.queryParams['redirect'] ?? '/' as string;
                router.navigateByUrl(redirect)
            }
        }
    } as Provider
}
