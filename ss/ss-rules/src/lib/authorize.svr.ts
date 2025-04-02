import { Injectable } from "@nestjs/common";
import { AuthorizeMessage, AuthorizeResult, IncomingMessage, _NullPermissionTypes, _ObjectPermissionTypes, _StringPermissionTypes } from "@noah-ark/common";
import { RulesService } from "./rules.svr";
import { authorize } from "@noah-ark/expression-engine";

@Injectable()
export class AuthorizeService {
    constructor(public readonly rulesService: RulesService) {}

    /**
     *
     * @param msg The message object to be authorized (it contains the path to the rule object and it contains the principle object)
     * @param action A string key that points to the specific permission inside the rule object @default rule.operation
     * @param additional Any data useful for the authorization function @example { new_data, old_data }
     * @returns grant or deny access for the provided msg/action
     */
    authorize(msg: IncomingMessage, action?: string, additional?: Record<string, unknown>): AuthorizeResult {
        let path = msg.path;
        const segments = path.split("/");
        while (segments.length > 0) {
            const rule = this.rulesService.getRule(path, true);
            const res = authorize(msg as AuthorizeMessage, rule, action, false, additional);

            if (res.access) return res;

            segments.pop();
            path = segments.join("/");
        }

        return { rule: undefined, action, access: "deny" };
    }
}
