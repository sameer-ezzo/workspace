
import { Inject } from '@nestjs/common';
import { Rule } from '@noah-ark/common';
import { Expression } from '@noah-ark/expression-engine';
import { RulesService } from '@ss/rules';

export function AuthZ(builtin = true,
    options?: {
        role: string,
        roles: string[],
        claim: { prop: string, value: object },
        exp: Expression
    }) {
    const injectRulesService = Inject(RulesService);

    return (target: any, _propertyKey: string, propertyDescriptor: PropertyDescriptor) => {
        injectRulesService(target, 'rulesService');
        const _rulesService = this.rulesService as RulesService
        const path = ''
        const name = ''
        const rule = { path, name, actions: {} } as Rule
        //_rulesService.addRule(path, {} as Rule); 
        //check if rule exists and update it or add it
    };
}