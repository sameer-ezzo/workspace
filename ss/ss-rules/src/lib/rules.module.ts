import { DynamicModule, Module, Provider } from '@nestjs/common'
import { Rule } from '@noah-ark/common'
import { CommonModule } from '@ss/common'
import { DataModule } from '@ss/data'
import { RulesService } from './rules.svr'
import { AuthorizeService } from './authorize.svr'
import { AuthorizeInterceptor } from "./authorize.interceptor"
import { PermissionController } from './permission.controller'

export const GrantRule: Rule = (() => {
    const rule = new Rule('/')
    rule.fallbackAuthorization = 'grant'
    return rule
})()
export const DenyRule: Rule = (() => {
    const rule = new Rule('/')
    rule.fallbackAuthorization = 'deny'
    return rule
})()
export const AuthenticatedRule: Rule = (() => {
    const rule = new Rule('/')
    rule.actions = { ['*']: [{ access: 'grant', by: 'user', action: '*' }] }
    return rule
})()

@Module({
    imports: [DataModule, CommonModule],
    controllers: [PermissionController],
    providers: [
        { provide: 'ROOT_RULE', useValue: DenyRule },
        { provide: 'APP_RULES', useValue: [] },
        RulesService,
        AuthorizeService,
        AuthorizeInterceptor
    ],
    exports: [RulesService, AuthorizeService],
})
export class RulesModule {
    static register(rootRule: Rule = DenyRule, appRules: Rule[] = []): DynamicModule {



        const providers: Provider[] = [
            { provide: 'ROOT_RULE', useValue: rootRule ?? DenyRule },
            { provide: 'APP_RULES', useValue: appRules ?? [] },
            RulesService,
            AuthorizeService,
            AuthorizeInterceptor
        ]

        return {
            module: RulesModule,
            providers,
            controllers: [PermissionController],
            exports: [...providers]
        }
    }
}
