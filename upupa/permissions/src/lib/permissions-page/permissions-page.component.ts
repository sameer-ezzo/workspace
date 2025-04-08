import { ChangeDetectionStrategy, Component, inject, model, signal } from "@angular/core";
import { PermissionsService } from "../permissions.service";
import { NodeModel } from "../node-model";
import { DOCUMENT } from "@angular/common";
import { RuleFormComponent } from "../rule-form/rule-form.component";
import { PermissionsSideBarComponent } from "../permissions-side-bar/permissions-side-bar.component";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatProgressBarModule } from "@angular/material/progress-bar";

@Component({
    selector: "permissions-page",
    templateUrl: "./permissions-page.component.html",
    styleUrls: ["./permissions-page.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [RuleFormComponent, MatProgressBarModule, PermissionsSideBarComponent, MatButtonModule, MatIconModule]
})
export class PermissionsPageComponent {
    nodes = model<NodeModel[]>([]);
    private permissionsService = inject(PermissionsService);
    ngOnInit() {
        this.getRules();
    }

    async getRules() {
        this.loading.set(true);
        try {
            const rules = await this.permissionsService.getRules();
            this.updateViewModel(rules);
        } catch (error) {
            console.error(error);
        } finally {
            this.loading.set(false);
        }
    }

    focused = signal<NodeModel>(null);
    private readonly doc = inject(DOCUMENT);
    loading = signal(false);
    private updateViewModel(rules: NodeModel[]) {
        this.nodes.set(rules);
        this.focused.set(rules[0]);
    }

    async export() {
        const permissions = await this.permissionsService.getRules(true);
        const json = JSON.stringify(permissions, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = this.doc.createElement("a");
        a.href = url;
        a.download = `permissions_${new Date().getTime() / 10000}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    async restore() {
        const input = this.doc.createElement("input");
        input.type = "file";
        input.accept = "application/json";
        input.click();
        const permissionsStr = await new Promise((resolve, reject) => {
            input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsText(file);
            };
        });
        const permissions = JSON.parse(permissionsStr as string);
        const keys = Object.keys(permissions);
        if (!keys.length) return;
        this.loading.set(true);
        try {
            const rules = await this.permissionsService.restorePermissions(permissions);
            this.updateViewModel(rules);
        } catch (error) {
            console.error(error);
        } finally {
            this.loading.set(false);
        }
    }
}
