import { Injectable } from "@nestjs/common";
import { AuthorizeResult, IncomingMessage, _NullPermissionTypes, _ObjectPermissionTypes, _StringPermissionTypes } from '@noah-ark/common';
import { RulesService } from "./rules.svr";
import { AuthorizeMessage, AuthorizerService } from "@noah-ark/expression-engine";



@Injectable()
export class AuthorizeService {

    
    constructor(public readonly rulesService: RulesService) { }

    /**
     *
     * @param msg The message object to be authorized (it contains the path to the rule object and it contains the principle object)
     * @param action A string key that points to the specific permission inside the rule object @default rule.operation
     * @param additional Any data useful for the authorization function @example { new_data, old_data }
     * @returns grant or deny access for the provided msg/action
     */
    authorize(msg: IncomingMessage, action?: string, additional?: Record<string, unknown>): AuthorizeResult {
        const rule = this.rulesService.getRule(msg.path, true)! // use default app rule
        return AuthorizerService.authorize(msg as AuthorizeMessage, rule, action, additional)
    }
}