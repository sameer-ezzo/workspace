import { DynamicModule, Module, Provider, Scope } from '@nestjs/common'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { AuthOptions } from './auth-options'
import { FusionAuthController } from './auth.controller'
import { AuthenticationInterceptor } from './auth.middleware'
import { FusionAuthService } from './auth.svr'
import { CommonModule } from '@ss/common'
import { DataModule } from '@ss/data'
import { RulesModule } from '@ss/rules'
import { FusionAuthClient } from '@fusionauth/typescript-client'

import { HttpModule } from '@nestjs/axios'

const defaultAuthOptions = new AuthOptions()


const providers: Provider[] = [
    { provide: 'AUTH_OPTIONS', useValue: defaultAuthOptions },
    FusionAuthService
]

@Module({
    controllers: [FusionAuthController],
    providers: [
        { provide: APP_INTERCEPTOR, useClass: AuthenticationInterceptor },
        ...providers],
    exports: [...providers],
    imports: [RulesModule, HttpModule, CommonModule],
})
export class FusionAuthModule {
    static register(authOptions: Partial<AuthOptions> = {}): DynamicModule {

        authOptions = { ...defaultAuthOptions, ...authOptions } as AuthOptions
        const errors = AuthOptions.getErrors(authOptions)
        if (errors) throw new Error('Invalid fusion auth options, ' + errors.join(', '))

        const providers: Provider[] = [
            { provide: 'AUTH_OPTIONS', useValue: authOptions },
            FusionAuthService
        ]

        return {
            module: FusionAuthModule,
            controllers: [FusionAuthController],
            providers: [
                { provide: APP_INTERCEPTOR, useClass: AuthenticationInterceptor },
                ...providers],
            exports: [...providers]
        };
    }
}



// Auth config should be provided in the root module:
// - Tenants
// - applications

