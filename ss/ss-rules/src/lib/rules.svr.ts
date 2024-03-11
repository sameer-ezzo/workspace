import { Inject, Injectable } from "@nestjs/common";
import { PathMatcher } from "@noah-ark/path-matcher";
import { Permission, Rule, AuthorizeFun, SimplePermission, Principle, SimplePermissionRecord } from "@noah-ark/common";
import { JsonPointer } from "@noah-ark/json-patch";
import { DataService } from "@ss/data";
import { EndpointsInfo, ENDPOINT_OPERATION, ENDPOINT_PATH, _controllerPrefix, EndpointInfoRecord } from "@ss/common";
import { join } from "path";
import { groupBy } from "lodash";

import { logger } from "./logger";
import { SimplePermissionSchema } from "./simple-permission.schema";
import { AUTHORIZE_PERMISSIONS, PermissionsSource } from "./constants";




@Injectable()
export class RulesService {
    private rulesPathMatcher: PathMatcher<Rule>;

    get tree() {
        return this.rulesPathMatcher.tree
    }
    get rules() {
        return this.rulesPathMatcher.items()
    }

    get root(): Rule {
        return this.rulesPathMatcher.root;
    }
    set root(root: Rule) {
        this.rulesPathMatcher.root = root;
    }


    constructor(
        @Inject("ROOT_RULE") readonly rootRule: Rule,
        @Inject("APP_RULES") readonly appRules: Rule[],
        public readonly dataService: DataService
    ) {
        this.rulesPathMatcher = new PathMatcher<Rule>(rootRule);
        dataService
            .addModel("permission", SimplePermissionSchema, undefined, [], true)
            .then(() => {
                this._seedRules(appRules);
            });
    }

    getRules(path?: string) {
        return this.rulesPathMatcher.items(path ?? '/').map(r => r.item)
    }
    getRule(path?: string, fallbackToParent = false): Rule | undefined {
        return this.rulesPathMatcher.get(path ?? '/', fallbackToParent)
    }

    addRule(path: string, rule: Rule) {
        //rule validation (name is required, path is unique,)
        if (!rule.name) throw new Error("Rule name is required");
        const _existingRule = this.rulesPathMatcher.get(path, false);
        if (_existingRule)
            throw new Error(`Rule ${rule.name} already exists at path ${path}`);
        this.rulesPathMatcher.add(path, rule);
    }
    async updatePermission(
        ruleName: string,
        action: string,
        permission: Permission<boolean | AuthorizeFun>,
        principle: Principle
    ): Promise<Permission<boolean | AuthorizeFun>> {
        const rule = this.findRuleByName(ruleName);

        if (!rule) throw new Error("Rule not found");
        let p = { ...permission }

        if (!permission._id) {
            const r = await this.dataService.post(`/permission`, p, principle)
            p = r.result as Permission<boolean | AuthorizeFun>
        }
        else
            await this.dataService.put(`/permission/${permission._id}`, p, principle);


        rule.actions ??= {}
        rule.actions[action] = (rule.actions[action] ?? []).filter(per => per._id !== p._id)
        rule.actions[action].push(p)

        const rulePath = rule.path.startsWith('/') ? rule.path : `/${rule.path}`
        JsonPointer.set(this.root, `${rulePath}/actions`, rule.actions);
        this.rulesPathMatcher.update(rulePath, rule)
        return p
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

        rule.actions ??= {}
        const pIdx = rule.actions[permission.action]?.findIndex(p => p._id === permission._id)
        if (pIdx > -1) rule.actions[permission.action].splice(pIdx, 1)
        JsonPointer.set(this.root, `${rule.path}/actions`, rule.actions)
        return await this.dataService.delete(`permission/${permission._id}`, principle);
    }

    private async _seedRules(rules: Rule[]) {
        for (const rule of rules) {
            this.addRule(rule.path, rule);
        }
        seedPermissions(this.dataService, this);
    }


}

function createRulesTreeFromEndpoints(rulesService: RulesService) {
    const source = Array.from(PermissionsSource)
    const list = source.map(s => {

        const target = s[0]
        const args = s[1]
        let prefix = null

        if (!args.controller) {
            prefix = _controllerPrefix(target)
            const fullPath = '/' + prefix
            return { ...s, fullPath, prefix, path: fullPath }

        }
        else {
            const path = Reflect.getMetadata(ENDPOINT_PATH, target)
            const operation = Reflect.getMetadata(ENDPOINT_OPERATION, target)

            const prefix = _controllerPrefix(args.controller)
            const fullPath = '/' + `${prefix}/${path}`.split('/').filter(s => s).join('/')
            return { permissions: args.permissions, prefix, fullPath, path, operation }

        }
    })

    const groups = groupBy(list, 'fullPath');
    for (const key in groups) {
        const g = groups[key];
        if (g.length === 0) continue;

        const rulePath = g.length > 1 ? key : g[0].prefix;
        const segments = rulePath.split('/');

        for (let i = 0; i < segments.length; i++) {
            const p = segments.slice(0, i + 1).join('/');
            const parentRule = i > 0 ? rulesService.getRule(segments.slice(0, i - 1).join('/')) : rulesService.rootRule;
            if (!rulesService.getRule(p))
                rulesService.addRule(p, {
                    path: p,
                    name: p,
                    builtIn: false,
                    fallbackAuthorization: parentRule.fallbackAuthorization,
                    fallbackSource: parentRule.fallbackSource ?? parentRule.name,
                    ruleSource: 'decorator',
                } as Rule);
        }
    }
}

function getAuthorizePermissionsFromEndpoints(endPoints: EndpointInfoRecord[], rulesService: RulesService) {
    return endPoints.map(ep => {
        const parentRule = rulesService.getRule(ep.fullPath, true)!
        return (Reflect.getMetadata(AUTHORIZE_PERMISSIONS, ep.descriptor.value) ?? []).map((p: any) => ({ ...p, name: ep.operation, action: ep.operation, rule: parentRule.name } as SimplePermission))
    }).reduce((ps, acc) => ([...ps, ...acc]), []);
}

function detectOrphanPermissions(rules: Rule[], permissions: SimplePermissionRecord[]) {
    const rulesNames = rules.map(x => x.name);
    const orphaned = permissions.filter(p => rulesNames.every(r => r !== p.rule));
    for (const o of orphaned)
        logger.warn(`Permission ${o.name} is orphaned as there is no rule ${o.rule}`);
}

async function seedPermissions(data: DataService, rulesService: RulesService) {


    const endPoints = [...EndpointsInfo.httpEndpoints, ...EndpointsInfo.wsEndpoints]
        .map(e => ({ ...e, fullPath: join(e.prefix, e.path) }))
    //Create Rules tree from endpoints
    createRulesTreeFromEndpoints(rulesService)
    const rules = rulesService.getRules().filter(r => r)



    const permissions = await data.get<SimplePermissionRecord[]>("permission");

    // Generate Permissions from endpoints with Authorize decorator
    const authorizePermissions = getAuthorizePermissionsFromEndpoints(endPoints, rulesService)

    permissions.push(...authorizePermissions)

    // Assign permissions to their rules
    if (permissions.length === 0) return;

    for (const r of rules) {
        r.actions ??= {}
        const rule_permissions = permissions.filter(p => p.rule === r.name)
        for (const p of rule_permissions) {
            r.actions[p.action] ??= []
            r.actions[p.action].push(p)
        }
        JsonPointer.set(rulesService, `${r.path}/actions`, r.actions)
    }

    //Detect orphan permissions
    detectOrphanPermissions(rules, permissions);
}