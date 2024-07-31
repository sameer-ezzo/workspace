import { ChangeDetectionStrategy, Component, inject, Input, signal, WritableSignal } from "@angular/core";
import { Rule, SimplePermission } from "@noah-ark/common";
import { PermissionsService } from "../permissions.service";
import { SnackBarService } from "@upupa/dialog";

@Component({
    selector: "rule-form",
    templateUrl: "./rule-form.component.html",
    styleUrls: ["./rule-form.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RuleFormComponent {

    loading = signal(false)
    actionNames = signal<string[]>([])
    actionPermissionsMap: Map<string, WritableSignal<SimplePermission[]>>
        = new Map()

    public permissionsService = inject(PermissionsService)
    private snack = inject(SnackBarService)


    private _rule: Rule;
    @Input()
    public get rule(): Rule {
        return this._rule;
    }
    public set rule(value: Rule) {
        if (this._rule === value) return;
        this._rule = value;
        if (!value) return
        this._rule.actions ??= {}
        this._init(this.rule)
    }

    private async _init(rule: Rule) {
        this.loading.set(true)
        const ruleActions = await this.permissionsService.getRuleActions(rule)

        this.actionPermissionsMap = new Map()
        const actions = [...new Set([...ruleActions])]
        actions.forEach(action => {
            rule.actions[action] ??= []
            const permissions = rule.actions[action] as SimplePermission[]
            this.actionPermissionsMap.set(action, signal<SimplePermission[]>(permissions))
        })
        this.actionNames.set(actions)
        this.loading.set(false)
    }



    updateRulePermissions(action, permissions) {
        this.rule.actions[action] = permissions
        this.actionPermissionsMap.get(action).set(permissions)
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
