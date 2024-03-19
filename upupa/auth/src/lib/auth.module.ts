import { NgModule, ModuleWithProviders, Provider, InjectionToken } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './auth.interceptor';
import { AuthOptions } from './auth-options';
import { AUTH_BASE_TOKEN, DEFAULT_FORBIDDEN_PROVIDER_TOKEN, DEFAULT_LOGIN_PROVIDER_TOKEN, DEFAULT_PASSWORD_POLICY_PROVIDER_TOKEN, DEFAULT_REDIRECT_PROVIDER_TOKEN, DEFAULT_VERIFY_PROVIDER_TOKEN } from './di.token';

const _options = new AuthOptions()

const convertToProvider = (token: InjectionToken<string>, option: string | Provider) => {
    if (typeof option === 'string') return { provide: token, useValue: option }
    return option
}

function authProviders(options: AuthOptions): Provider[] {
    return [
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
        { provide: DEFAULT_PASSWORD_POLICY_PROVIDER_TOKEN, useValue: options.password_policy },
        options.auth_base_url ? convertToProvider(AUTH_BASE_TOKEN, options.auth_base_url) : null,
        options.default_login_url ? convertToProvider(DEFAULT_LOGIN_PROVIDER_TOKEN, options.default_login_url) : null,
        options.default_forbidden_url ? convertToProvider(DEFAULT_FORBIDDEN_PROVIDER_TOKEN, options.default_forbidden_url) : null,
        options.default_verify_url ? convertToProvider(DEFAULT_VERIFY_PROVIDER_TOKEN, options.default_verify_url) : null,
        options.redirect_url ? convertToProvider(DEFAULT_REDIRECT_PROVIDER_TOKEN, options.redirect_url) : null
    ].filter(e => e) as Provider[]
}

@NgModule({
    imports: [CommonModule],
    providers: [
        ...authProviders(_options)
    ]
})
export class AuthModule {

    // constructor(@Optional() @SkipSelf() parentModule: AuthModule) {
    //     if (parentModule) {
    //         throw new Error('AuthModule is already loaded. Import it in the AppModule only');
    //     }
    // }

    public static forRoot(baseUrl: string, options?: AuthOptions): ModuleWithProviders<AuthModule> {
        options = { ..._options, ...options, auth_base_url: baseUrl }

        return {
            ngModule: AuthModule,
            providers: [...authProviders(options)]
        };
    }
}