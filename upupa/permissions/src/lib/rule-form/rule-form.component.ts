import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { Rule, SimplePermission } from "@noah-ark/common";
import { BehaviorSubject, map, ReplaySubject } from "rxjs";
import { PermissionsService } from "../permissions.service";
import { SnackBarService } from "@upupa/common";

@Component({
    selector: "rule-form",
    templateUrl: "./rule-form.component.html",
    styleUrls: ["./rule-form.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RuleFormComponent {

    loading$ = new BehaviorSubject<boolean>(false)
    actionNames$ = new ReplaySubject<string[]>(1)
    actionPermissions: Map<string, BehaviorSubject<SimplePermission[]>>

    private _rule: Rule;
    @Input()
    public get rule(): Rule {
        return this._rule;
    }
    public set rule(value: Rule) {
        if (this._rule === value) return;
        this._rule = value;
        this._rule.actions ??= {  }
        this._init(this.rule)
    }

    private async _init(rule: Rule) {
        this.loading$.next(true)
        const ruleActions = await this.permissionsService.getRuleActions(rule)

        this.actionPermissions = new Map<string, BehaviorSubject<SimplePermission[]>>()
        const actions = [...new Set(['*', ...ruleActions])]
        actions.forEach(action => {
            rule.actions[action] ??= []
            const permissions = rule.actions[action] as SimplePermission[]
            this.actionPermissions.set(action, new BehaviorSubject<SimplePermission[]>(permissions))
        })
        this.actionNames$.next(actions)
        this.loading$.next(false)
    }

    constructor(public permissionsService: PermissionsService, private snack: SnackBarService) { }

    updateRulePermissions(action, permissions) {
        this.rule.actions[action] = permissions
        this.actionPermissions.get(action).next(permissions)
    }

    async addPermission(action: string) {

        if (!(action in this.rule.actions)) throw new Error(`Rule: ${this.rule.name ?? this.rule.path} does not include ${action} action.`);
        try {

            const permission = await this.permissionsService.addOrUpdatePermission(
                {
                    action,
                    by: "anonymous",
                    rule: this.rule.name,
                    access: 'deny'
                } as SimplePermission
            );


            const actionPermissions = this.rule.actions[action] ?? [];
            actionPermissions.push(permission);

            this.updateRulePermissions(action, actionPermissions.slice());
        }
        catch (err) {
            this.snack.openFailed(err.message, err)
        }
    }
}
