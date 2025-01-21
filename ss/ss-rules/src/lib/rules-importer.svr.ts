import { Injectable, Inject } from "@nestjs/common";
import { Rule, Principle, SimplePermission } from "@noah-ark/common";
import { logger } from "./logger";
import { RulesService } from "./rules.svr";

export type RulePayload = { rule: Rule; children: RulePayload[] };

@Injectable()
export class RulesImporterService {
    constructor(@Inject(RulesService) private readonly rulesService: RulesService) {}

    async restore(rules: RulePayload[], principle: Principle) {
        if (!rules || rules.length === 0) return;
        for (const r of rules) {
            // logger.info(`restore`, r);
            await this.restoreRule(r, principle);
        }
        return { message: "Permissions restored successfully" };
    }

    actionsStr = (actions: Rule["actions"]) => Object.keys(actions).join(", ");
    async restoreRule(item: RulePayload, principle: Principle) {
        const rule = item.rule as Rule;
        // logger.info(`restoreRule: ${rule.name}, ${this.actionsStr(rule.actions)}`);
        await this.restoreActions(rule.name, rule.actions);
        await this.restore(item.children, principle);
    }

    async restoreActions(name: string, actions: Rule["actions"], principle?: Principle) {
        logger.info(`restoreActions: ${name}, ${this.actionsStr(actions)}`);

        if (!actions) return;
        const actionsKeys = Object.getOwnPropertyNames(actions);
        for (const action of actionsKeys) {
            const permissions = (actions[action] ?? []) as SimplePermission[];
            for (const permission of permissions) {
                logger.info(`restoreAction: ${action}, ${permission._id}`);

                if (!permission._id) continue; // prevent restoring permissions that are not saved in the database
                try {
                    await this.rulesService.updatePermission(name, action, permission, principle);
                } catch (e) {
                    const msg = e.message || "Unknown error";
                    logger.error(`Failed to restore permission action ${action} for rule ${name}. Error: ${msg}`);
                }
            }
        }
    }
}
