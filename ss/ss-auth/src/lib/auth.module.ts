import { DynamicModule, Module, Provider } from '@nestjs/common'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { AuthOptions } from './auth-options'
import { AuthController } from './auth.controller'
import { AuthenticationInterceptor } from './auth.middleware'
import { AuthService } from './auth.svr'
import { CommonModule, __secret } from '@ss/common'
import { randomString } from '@noah-ark/common'
import { logger } from "./logger";

import { PassportModule } from '@nestjs/passport'
import { FacebookStrategy } from './external/facebook.strategy'
import { GoogleStrategy } from './external/google.strategy'
import { DataModule } from '@ss/data'

const defaultAuthOptions = new AuthOptions()
const _authOptions = {
    secret: __secret(),
    accessTokenExpiry: process.env.accessTokenExpiry || defaultAuthOptions.accessTokenExpiry,
    refreshTokenExpiry: process.env.refreshTokenExpiry || defaultAuthOptions.refreshTokenExpiry,
    forceEmailVerification: process.env.forceEmailVerification === 'true',
    forcePhoneVerification: process.env.forcePhoneVerification === 'true',
    issuer: process.env.issuer || defaultAuthOptions.issuer,
    maximumAllowedLoginAttempts: process.env.maximumAllowedLoginAttempts
        ? +process.env.maximumAllowedLoginAttempts
        : defaultAuthOptions.maximumAllowedLoginAttempts,
    maximumAllowedLoginAttemptsExpiry: process.env.maximumAllowedLoginAttemptsExpiry
        ? +process.env.maximumAllowedLoginAttemptsExpiry
        : defaultAuthOptions.maximumAllowedLoginAttemptsExpiry,
    resetTokenExpiry: process.env.resetTokenExpiry || defaultAuthOptions.resetTokenExpiry,
    sendWelcomeEmail: process.env.sendWelcomeEmail === 'true'
} as AuthOptions

if (process.env.GOOGLE_CLIENT_ID) {
    _authOptions.externalAuth ??= {}
    _authOptions.externalAuth.google ??= {
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        client_url: process.env.CLIENT_URL || '',
        callback_base: process.env.CALLBACK_BASE || ''
    }
}

if (process.env.FACEBOOK_APP_ID) {
    _authOptions.externalAuth ??= {}
    _authOptions.externalAuth.facebook ??= {
        app_id: process.env.FACEBOOK_APP_ID || '',
        app_secret: process.env.FACEBOOK_APP_SECRET || '',
        client_url: process.env.CLIENT_URL || '',
        callback_base: process.env.CALLBACK_BASE || ''
    }
}
const providers: Provider[] = [
    AuthService,
    { provide: 'AUTH_OPTIONS', useValue: _authOptions },
    { provide: 'AUTH_DB', useExisting: process.env['DB_AUTH'] ? 'DB_AUTH' : 'DB_DEFAULT' }
]

@Module({
    controllers: [AuthController],
    providers: [
        { provide: APP_INTERCEPTOR, useClass: AuthenticationInterceptor },
        ...providers
    ],
    exports: [...providers],
    imports: [DataModule, CommonModule, PassportModule],
})
export class AuthModule {
    static register(authOptions: Partial<AuthOptions> = {}): DynamicModule {

        authOptions = { ..._authOptions, ...authOptions } as AuthOptions
        if (authOptions.secret !== __secret()) {
            logger.error('Auth secret has been overridden (the one passed in env is used)')
            authOptions.secret = __secret()
        }
        if (!authOptions.secret) {

            logger.error('Auth secret is not set')

            const prod = process.env.NODE_PROD === 'production'
            authOptions.secret = prod ? randomString(10) : 'dev-secret-PLEASE-CHANGE!'
            process.env.secret = authOptions.secret
            process.env.SECRET = authOptions.secret
        }

        const providers: Provider[] = [
            AuthService,
            { provide: 'AUTH_OPTIONS', useValue: authOptions },
            { provide: 'AUTH_DB', useExisting: process.env['DB_AUTH'] ? 'DB_AUTH' : 'DB_DEFAULT' },

        ]


        //EXTERNAL AUTH
        if (authOptions.externalAuth?.google) providers.push(GoogleStrategy)
        if (authOptions.externalAuth?.facebook) providers.push(FacebookStrategy)

        return {
            module: AuthModule,
            exports: [...providers],
            controllers: [AuthController],
            providers: [
                { provide: APP_INTERCEPTOR, useClass: AuthenticationInterceptor },
                ...providers
            ]
        };
    }
}
