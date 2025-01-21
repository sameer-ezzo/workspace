import { ChangeDetectionStrategy, Component, computed, inject, input, resource, signal, SimpleChanges } from "@angular/core";
import { Rule } from "@noah-ark/common";
import { PermissionsService } from "../permissions.service";
import { RulePermissionsTableComponent } from "../rule-permissions-table/rule-permissions-table.component";
import { MatIconModule } from "@angular/material/icon";
import { TitleCasePipe } from "@angular/common";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatButtonModule } from "@angular/material/button";
import { NodeModel } from "../node-model";

@Component({
    standalone: true,
    selector: "rule-form",
    templateUrl: "./rule-form.component.html",
    styleUrls: ["./rule-form.component.scss"],
    imports: [RulePermissionsTableComponent, MatIconModule, MatButtonModule, TitleCasePipe, MatProgressBarModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RuleFormComponent {
    public permissionsService = inject(PermissionsService);
    loading = signal(false);
    node = input.required<NodeModel>();
    rule = computed(() => this.node().rule as Rule);

    actionNames = signal([]);

    async ngOnChanges(changes: SimpleChanges) {
        if (changes["node"]) {
            this.loading.set(true);
            const ruleNames = this.rule().actions ? Object.keys(this.rule().actions) : [];
            try {
                const serverNames = await this.permissionsService.getRuleActions(this.rule());
                this.actionNames.set(Array.from(new Set([...serverNames, ...ruleNames])));
            } catch (error) {
                this.actionNames.set(Array.from(new Set([...ruleNames])));
            } finally {
                this.loading.set(false);
            }
        }
    }
}
