import { ChangeDetectionStrategy, Component, inject, input, model, SimpleChanges } from "@angular/core";
import { DataAdapter, ClientDataSource } from "@upupa/data";
import { ActionDescriptor, ActionEvent } from "@upupa/common";
import { AccessType, AuthorizeMessage, Rule, SimplePermission, _NullPermissionTypes, _ObjectPermissionTypes, _StringPermissionTypes } from "@noah-ark/common";
import { PermissionsService } from "../permissions.service";
import { column, ColumnsDescriptor, DataTableComponent, DefaultTableCellTemplate, reflectTableViewModel } from "@upupa/table";
import { AUTHORIZATION_TEMPLATES } from "@noah-ark/expression-engine";
import { PromptService, SnackBarService } from "@upupa/dialog";
import { MatIconModule } from "@angular/material/icon";
import { FormsModule } from "@angular/forms";
import { CommonModule, JsonPipe, TitleCasePipe } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";

import { toSignal } from "@angular/core/rxjs-interop";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatBtnComponent } from "@upupa/mat-btn";

@Component({
    selector: "info-cell-template",
    imports: [MatIconModule, MatTooltipModule],
    template: `
        @if (item().builtIn === true) {
            <mat-icon style="transform: scale(0.8)" matTooltip="Built in permission">info</mat-icon>
        }
    `,
})
export class InfoCellTemplateComponent extends DefaultTableCellTemplate {}
@Component({
    selector: "access-cell-template",
    imports: [TitleCasePipe, FormsModule],
    template: `
        @if (item().builtIn === true) {
            {{ item().access | titlecase }}
        } @else {
            <select [ngModel]="item().access" (change)="changeAccess(item(), $event.target)">
                <option value=""></option>
                <option value="deny">Deny</option>
                <option value="grant">Grant</option>
            </select>
        }
    `,
})
export class AccessCellTemplateComponent extends DefaultTableCellTemplate {
    table = inject(DataTableComponent);
    adapter = this.table.adapter();
    private readonly permissionsService = inject(PermissionsService);

    async changeAccess(permission: SimplePermission, target: EventTarget) {
        let access = (target as HTMLInputElement).value as unknown | AccessType | "";

        if (permission.access === access) return;
        if (access === "" || (access !== "deny" && access !== "grant")) access = undefined;
        const update = Object.assign({}, permission, { access });
        const updatedPermission = await this.permissionsService.addOrUpdatePermission(update);
        this.adapter.put(this.item(), updatedPermission);
    }
}

@Component({
    selector: "by-cell-template",
    imports: [FormsModule],
    template: ` @if (item().builtIn === true) {
            {{ permissionType(item().by).display }}
        } @else {
            <select [ngModel]="item().by" (change)="changeType(item(), $event.target)">
                @for (pt of permissionTypes(); track pt.value) {
                    <option [value]="pt.value">
                        {{ pt.display }}
                    </option>
                }
            </select>
        }`,
})
export class ByCellTemplateComponent extends DefaultTableCellTemplate {
    table = inject(DataTableComponent);
    adapter = this.table.adapter();
    private readonly permissionsService = inject(PermissionsService);
    async changeType(permission: any, target: EventTarget) {
        const by = (target as HTMLInputElement).value as string;
        if (permission.by === by) return;

        const update = Object.assign({}, permission, { by, value: "" });
        const updatedPermission = await this.permissionsService.addOrUpdatePermission(update);
        this.adapter.put(this.item(), updatedPermission);
    }

    permissionType = (v: string) => {
        return this.permissionTypes().find((t) => t.value === v) || { display: v, value: v };
    };
    permissionTypes = () =>
        [
            { value: "anonymous", display: "Visitor" },
            { value: "user", display: "Logged in user" },
            { value: "emv", display: "User with verified email" },
            { value: "phv", display: "User with verified phone" },
            { value: "role", display: "User with specific role" },
            { value: "email", display: "User with specific email" },
            { value: "phone", display: "User with specific phone" },
            { value: "claim", display: "User with specific claim" },
            ...Object.keys(AUTHORIZATION_TEMPLATES).map((k) => ({ value: k, display: k })),
        ].filter((v, i, a) => a.findIndex((t) => t.value === v.value) === i);
}
@Component({
    selector: "value-cell-template",
    imports: [MatIconModule, MatButtonModule, FormsModule, JsonPipe],
    template: `
        @if (item().builtIn === true) {
            {{ item().value }}
        } @else {
            @switch (item().valueType || item().by) {
                @case ("role") {
                    <select [ngModel]="item().value" (change)="changeValue(item(), $event.target)">
                        @for (role of roles(); track role._id) {
                            <option [value]="role._id">
                                {{ role.name }}
                            </option>
                        }
                    </select>
                }
                @case ("email") {
                    <input #perValueInput [value]="item().value" placeholder="Enter valid user {{ item().by }} address" type="{{ item().by }}" />
                    @if (item().value !== perValueInput.value) {
                        <button mat-icon-button (click)="changeValue(item(), perValueInput)">
                            <mat-icon>check</mat-icon>
                        </button>
                        <button mat-icon-button (click)="perValueInput.value = item().value">
                            <mat-icon>undo</mat-icon>
                        </button>
                    }
                }
                @case ("phone") {
                    <input #perValueInput [value]="item().value" placeholder="Enter valid user {{ item().by }} address" type="{{ item().by }}" />
                    @if (item().value !== perValueInput.value) {
                        <button mat-icon-button (click)="changeValue(item(), perValueInput)">
                            <mat-icon>check</mat-icon>
                        </button>
                        <button mat-icon-button (click)="perValueInput.value = item().value">
                            <mat-icon>undo</mat-icon>
                        </button>
                    }
                }
                @case ("claim") {
                    {{ item().value | json }}
                    <button mat-icon-button>
                        <mat-icon>edit</mat-icon>
                    </button>
                }
                @default {
                    <p>{{ item().value }}</p>
                }
            }
        }
    `,
})
export class ValueCellTemplateComponent extends DefaultTableCellTemplate {
    private readonly rolesService = inject(PermissionsService);
    roles = toSignal(this.rolesService.roles);
    table = inject(DataTableComponent);
    adapter = this.table.adapter();
    private readonly permissionsService = inject(PermissionsService);

    async changeValue(permission: any, target: EventTarget | HTMLInputElement) {
        const value = (target as HTMLInputElement).value;

        if (permission.value === value) return;
        const update = Object.assign({}, permission, { value: value.trim() });
        const updatedPermission = await this.permissionsService.addOrUpdatePermission(update);
        this.adapter.put(this.item(), updatedPermission);
    }
}
@Component({
    selector: "selectors-cell-template",
    imports: [MatIconModule, MatButtonModule, JsonPipe],
    template: `
        <div style="display: flex; align-items: center; overflow: hidden; max-width: 300px">
            <span>
                {{ item().selectors | json }}
            </span>
            @if (!item().builtIn) {
                <button mat-icon-button (click)="editFilters(item())">
                    <mat-icon>tune</mat-icon>
                </button>
            }
        </div>
    `,
})
export class SelectorsCellTemplateComponent extends DefaultTableCellTemplate {
    table = inject(DataTableComponent);
    adapter = this.table.adapter();
    private readonly promptService = inject(PromptService);
    private readonly permissionsService = inject(PermissionsService);
    async editFilters(permission: SimplePermission) {
        if (permission.builtIn) return;

        const v = JSON.stringify(permission.selectors ?? {}, null, 2);
        const filtersStr = await this.promptService.open(
            {
                view: "textarea",
                rows: 25,
                title: "Edit Filters",
                value: v,
                no: "Cancel",
                yes: "Update",
                text: "Please enter the filters for this permission",
                placeholder: JSON.stringify({ query: { "createdBy.email": "$msg.principle.email" } }, null, 2),
            },
            { maxWidth: "800px" },
        );
        if (!filtersStr || v === filtersStr) return;
        try {
            const filters = JSON.parse(filtersStr);

            if (permission.selectors === filters) return;

            const update = Object.assign({}, permission, { selectors: filters });
            const updatedPermission = await this.permissionsService.addOrUpdatePermission(update);

            this.adapter.put(this.item(), updatedPermission);
        } catch (error) {
            console.error(error);
        }
    }
}

@Component({
    selector: "delete-permission-button",
    imports: [MatBtnComponent],
    template: ` <mat-btn [buttonDescriptor]="btn" (action)="deletePermission()" [disabled]="item().builtIn"></mat-btn> `,
})
export class DeletePermissionButtonComponent extends DefaultTableCellTemplate {
    table = inject(DataTableComponent);
    adapter = this.table.adapter();
    private readonly permissionsService = inject(PermissionsService);

    btn = {
        name: "delete",
        variant: "icon",
        icon: "delete",
        color: "warn",
    } as ActionDescriptor;
    async deletePermission() {
        if (this.item().builtIn) return;
        await this.permissionsService.deletePermission(this.item());
        this.adapter.delete(this.item());
    }
}

export class PermissionRowViewModel {
    @column({ visible: false })
    select: boolean;
    _id: string;
    @column({ header: "Info", width: 0.1, template: [InfoCellTemplateComponent] })
    builtIn: SimplePermission["builtIn"];

    @column({ header: "Access", width: 100, template: [AccessCellTemplateComponent] })
    access: SimplePermission["access"];
    @column({ header: "By", width: 200, template: [ByCellTemplateComponent] })
    by: SimplePermission["by"];
    @column({ header: "Value", width: 200, template: [ValueCellTemplateComponent] })
    value: any;
    @column({ header: "Value", width: 100, template: [SelectorsCellTemplateComponent] })
    selectors: SimplePermission["selectors"];

    @column({ header: " ", class: "actions", template: [DeletePermissionButtonComponent] })
    actions: any;
}
@Component({
    selector: "rule-permissions-table",
    templateUrl: "./rule-permissions-table.component.html",
    styleUrls: ["./rule-permissions-table.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatIconModule, MatButtonModule, DataTableComponent, FormsModule, CommonModule],
})
export class RulePermissionsTableComponent {
    focused = model<SimplePermission>();

    rule = input.required<Rule>();
    action = input.required<string>();
    snack = inject(SnackBarService);

    ngOnChanges(changes: SimpleChanges) {
        if (changes["rule"] || changes["action"]) {
            const permissions = this.rule().actions?.[this.action()] ?? ([] as SimplePermission[]);
            this.dataSource.all = permissions;
            this.adapter.refresh();
        }
    }

    tableColumns = reflectTableViewModel(PermissionRowViewModel).columns; // { ...TABLE_COLUMNS } as unknown as ColumnsDescriptor;

    dataSource = new ClientDataSource([], "_id");
    adapter = new DataAdapter(this.dataSource, "_id");
    public readonly permissionsService = inject(PermissionsService);

    tableActions = [
        (item) => {
            return item?.builtIn === true
                ? []
                : [
                      {
                          name: "delete",
                          variant: "icon",
                          icon: "delete",
                          color: "warn",
                      } as ActionDescriptor,
                  ];
        },
    ];

    async onTableAction(e: ActionEvent) {
        const action = e.descriptor.name;
        switch (action) {
            case "delete": {
                await this.permissionsService.deletePermission(e.data[0]);
                this.adapter.delete(e.data[0]);
                break;
            }
            default:
                break;
        }
    }

    async addPermission() {
        const action = this.action();
        const rule = this.rule();
        if (!(action in rule.actions)) console.warn(`Rule: ${rule.name ?? rule.path} does not include ${action} action.`);

        try {
            const permission = await this.permissionsService.addOrUpdatePermission({
                action,
                by: "anonymous",
                rule: rule.name,
                access: "deny",
            } as SimplePermission);

            const actionPermissions = rule.actions[action] ?? [];
            actionPermissions.push(permission);
            this.adapter.create(permission);

            // this.updateRulePermissions(action, actionPermissions.slice());
        } catch (err) {
            this.snack.openFailed(err.message, err);
        }
    }
}

const TABLE_COLUMNS = {
    select: 0,
    info: { header: "Info", width: "0.1" },
    access: { header: "Access", width: "0.2" },
    type: { header: "Type", width: "0.2" },
    value: { header: "Value" },
    selectors: { header: "Filters", width: "0.2" },
} as unknown as ColumnsDescriptor;
