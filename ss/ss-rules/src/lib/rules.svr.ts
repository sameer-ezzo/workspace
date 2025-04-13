import { Inject, Injectable } from "@nestjs/common";
import { Permission, Rule, AuthorizeFun, SimplePermission, Principle, RulesManager } from "@noah-ark/common";
import { JsonPointer } from "@noah-ark/json-patch";
import { DataService } from "@ss/data";
import { EndpointsInfo, _controllerPrefix, EndpointInfoRecord } from "@ss/common";
import { join } from "path";
import { groupBy } from "lodash-es";

import { logger } from "./logger";
import { AUTHORIZE_PERMISSIONS } from "./constants";

export function joinPaths(...segments: string[]): string {
    return "/" + segments.flatMap((c) => (c ?? "").split("/").filter((s) => s)).join("/");
}

@Injectable()
export class RulesService {
    rulesManager!: RulesManager;
    constructor(
        @Inject("ROOT_RULE") readonly rootRule: Rule,
        @Inject("APP_RULES") readonly appRules: Rule[],
        @Inject(DataService) public readonly dataService: DataService,
    ) {
        this.initializeRulesManager();
    }

    async initializeRulesManager() {
        this.rulesManager = new RulesManager(this.rootRule);
        await this._seedRules(this.appRules);
    }

    getRules(path?: string) {
        return this.rulesManager.items(path ?? "/").map((r) => r.item);
    }
    getRule(path?: string, fallbackToParent = false): Rule | undefined {
        return this.rulesManager.get(path ?? "/", fallbackToParent);
    }

    addRule(path: string, rule: Rule) {
        //rule validation (name is required, path is unique,)
        if (!rule.name) throw new Error("Rule name is required");
        const _existingRule = this.rulesManager.get(path, false);
        if (_existingRule) {
            logger.warn(`Rule ${rule.name} already exists at path ${path}`);
        }
        this.rulesManager.add(path, rule);
    }
    async updatePermission(ruleName: string, action: string, permission: Permission<boolean | AuthorizeFun>, principle: Principle): Promise<Permission<boolean | AuthorizeFun>> {
        const rule = this.findRuleByName(ruleName);

        if (!rule) throw new Error("Rule not found");
        let p = { ...permission };

        if (!permission._id) {
            const r = await this.dataService.post(`/permission`, p, principle);
            p = r.document as Permission<boolean | AuthorizeFun>;
        } else await this.dataService.put(`/permission/${permission._id}`, p, principle);

        rule.actions ??= {};
        rule.actions[action] = (rule.actions[action] ?? []).filter((per) => per._id !== p._id);
        rule.actions[action].push(p);

        const rulePath = rule.path.startsWith("/") ? rule.path : `/${rule.path}`;
        this.rulesManager.updateRootWith(`${rulePath}/actions`, rule.actions);
        this.rulesManager.updateRule(rulePath, rule);
        return p;
    }

    findRuleByName(name: string): Rule | undefined {
        return this.getRules().find((r) => r?.name === name);
    }

    async deletePermission(id: string, principle: Principle) {
        if (!id) throw new Error("Id is required");
        const permission = await this.dataService.get(`/permission/${id}`);
        if (!permission) throw new Error("Permission not found");

        const rule = this.findRuleByName(permission.rule);
        if (!rule) throw new Error("Rule not found");

        rule.actions ??= {};
        const pIdx = rule.actions[permission.action]?.findIndex((p) => p._id === permission._id);
        if (pIdx > -1) rule.actions[permission.action].splice(pIdx, 1);
        this.rulesManager.updateRootWith(`${rule.path}/actions`, rule.actions);
        return await this.dataService.delete(`permission/${permission._id}`, principle);
    }

    private async _seedRules(rules: Rule[]) {
        for (const rule of rules) {
            this.addRule(rule.path, rule);
        }
        seedPermissions(this.dataService, this);
    }
}

function createRulesTreeFromEndpoints(endPoints, rulesService: RulesService) {
    const list = endPoints.map((s) => {
        const { controller, descriptor, prefix, fullPath, path, operation } = s;
        let _path = path,
            _fullPath = fullPath;

        if (path.includes("**")) {
            _path = "/";
            _fullPath = joinPaths(prefix);
        }
        const permissions = Reflect.getMetadata(AUTHORIZE_PERMISSIONS, descriptor ? descriptor.value : controller) ?? [];

        const result = {
            prefix,
            path: _path,
            fullPath: _fullPath,
            operation,
            permissions,
        };
        return result;
    });

    const groups = groupBy(list, "fullPath");
    for (const fullPath in groups) {
        const g = groups[fullPath];
        if (g.length === 0) continue;

        const rulePath = g[0].prefix ?? "";
        const segments = rulePath.split("/").filter((s) => s.length > 0);

        for (let i = 0; i < segments.length; i++) {
            const p = segments.slice(0, i + 1).join("/");
            const parentRule = i > 0 ? rulesService.getRule(segments.slice(0, i - 1).join("/")) : rulesService.rootRule;
            if (!rulesService.getRule(p)) {
                logger.info(`Creating rule ${p} under ${parentRule.name}`);
                rulesService.addRule(p, {
                    path: p,
                    name: p,
                    builtIn: false,
                    fallbackAuthorization: parentRule.fallbackAuthorization,
                    ruleSource: "decorator",
                    actions: {},
                } as Rule);
            }
        }
    }
}

function getAuthorizePermissionsFromEndpoints(endPoints: EndpointInfoRecord[], rulesService: RulesService) {
    const res = endPoints
        .map((ep) => {
            const parentRule = rulesService.getRule(ep.fullPath, true)!;
            return (Reflect.getMetadata(AUTHORIZE_PERMISSIONS, ep.descriptor.value) ?? []).map(
                (p: any) =>
                    ({
                        ...p,
                        name: ep.operation,
                        action: ep.operation,
                        rule: parentRule.name,
                    }) as SimplePermission,
            );
        })
        .reduce((ps, acc) => [...ps, ...acc], []);

    return res;
}

function detectOrphanPermissions(rules: Rule[], permissions: SimplePermission[]) {
    const rulesNames = rules.map((x) => x.name);
    const orphaned = permissions.filter((p) => rulesNames.every((r) => r !== p.rule));
    for (const o of orphaned) logger.warn(`Permission ${o.name} is orphaned as there is no rule ${o.rule}`);
}

async function seedPermissions(data: DataService, rulesService: RulesService) {
    const endPoints = [...EndpointsInfo.httpEndpoints, ...EndpointsInfo.wsEndpoints].map((e) => ({ ...e, fullPath: join(e.prefix ?? "", e.path ?? "") }));

    //Create Rules tree from endpoints
    createRulesTreeFromEndpoints(endPoints, rulesService);

    const rules = rulesService.getRules().filter((r) => r);
    const permissionsModel = await data.getModel("permission");
    const permissions: SimplePermission[] = (await permissionsModel.find({}).lean()) as unknown as SimplePermission[];

    // Generate Permissions from endpoints with Authorize decorator
    const authorizePermissions = getAuthorizePermissionsFromEndpoints(endPoints, rulesService);

    permissions.push(...authorizePermissions);

    // Assign permissions to their rules
    if (permissions.length === 0) return;

    for (const r of rules) {
        r.actions ??= {};
        const rule_permissions = permissions.filter((p) => p.rule === r.name);
        for (const p of rule_permissions) {
            r.actions[p.action] ??= [];
            r.actions[p.action].push(p);
        }
        JsonPointer.set(rulesService, `${r.path}/actions`, r.actions);
    }

    //Detect orphan permissions
    detectOrphanPermissions(rules, permissions);
}
