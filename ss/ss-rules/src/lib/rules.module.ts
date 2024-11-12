import {
    DynamicModule,
    Inject,
    Module,
    OnModuleInit,
    Provider,
} from '@nestjs/common';
import { FunctionalPermission, Rule, unreachable } from '@noah-ark/common';
import { CommonModule } from '@ss/common';
import { DataModule, DataService } from '@ss/data';
import { RulesService } from './rules.svr';
import { RulesImporterService } from './rules-importer.svr';
import { AuthorizeService } from './authorize.svr';
import { AuthorizeInterceptor } from './authorize.interceptor';
import { PermissionController } from './permission.controller';
import { APP_INTERCEPTOR } from '@nestjs/core';
import {
    AUTHORIZATION_TEMPLATES,
    AuthorizationTemplate,
} from '@noah-ark/expression-engine';
import { MongooseModule } from '@nestjs/mongoose';
import { SimplePermissionSchema } from './simple-permission.schema';

export function rootRule(defaultAccess: 'GRANT' | 'DENY' | 'LOGGED' = 'DENY') {
    switch (defaultAccess) {
        case 'GRANT':
            return GrantRule;
        case 'DENY':
            return GrantRule;
        case 'LOGGED':
            return GrantRule;
        default:
            throw unreachable('root rule access', defaultAccess, false);
    }
}

export const GrantRule: Rule = (() => {
    const rule = new Rule('root');
    rule.fallbackAuthorization = 'grant';
    return rule;
})();
export const DenyRule: Rule = (() => {
    const rule = new Rule('root');
    rule.fallbackAuthorization = 'deny';
    return rule;
})();

export class RulesModule implements OnModuleInit {
    constructor(@Inject(DataService) public readonly data: DataService) {}
    async onModuleInit() {
        // await this.data.addModel('permission', SimplePermissionSchema);
    }
    static register(
        rootRule: Rule = DenyRule,
        appRules: Rule[] = [],
        templates: AuthorizationTemplate[] = []
    ): DynamicModule {
        (appRules ??= []).forEach((r) => {
            if (!r.ruleSource) r.ruleSource = 'code';
        });

        for (const template of templates) {
            if (!AUTHORIZATION_TEMPLATES[template.by])
                AUTHORIZATION_TEMPLATES[template.by] = template.template;
        }

        const providers: Provider[] = [
            { provide: 'ROOT_RULE', useValue: rootRule ?? DenyRule },
            { provide: 'APP_RULES', useValue: appRules },
            RulesService,
            RulesImporterService,
            AuthorizeService,
        ];

        return {
            global: true,
            module: RulesModule,
            imports: [
                DataModule,
                CommonModule,
                MongooseModule.forFeature(
                    [{ name: 'permission', schema: SimplePermissionSchema }],
                    'DB_DEFAULT'
                ),
            ],
            providers: [
                ...providers,
                { provide: APP_INTERCEPTOR, useClass: AuthorizeInterceptor },
            ],
            controllers: [PermissionController],
            exports: [...providers],
        };
    }
}
