import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, inject, Input, Output, signal } from "@angular/core";
import { DataAdapter, ClientDataSource } from "@upupa/data";
import { ActionDescriptor, ActionEvent } from "@upupa/common";
import { AccessType, AuthorizeMessage, SimplePermission, _NullPermissionTypes, _ObjectPermissionTypes, _StringPermissionTypes } from "@noah-ark/common";
import { PermissionsService } from "../permissions.service";
import { ColumnsDescriptor } from "@upupa/table";
import { AUTHORIZATION_TEMPLATES } from "@noah-ark/expression-engine";
import { PromptService } from "@upupa/dialog";

@Component({
    selector: "rule-permissions-table",
    templateUrl: "./rule-permissions-table.component.html",
    styleUrls: ["./rule-permissions-table.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RulePermissionsTableComponent {
    focused: any;
    permissionTypes = PERMISSIONS_TYPES();
    @Input() action: string;

    @Output() permissionsChange = new EventEmitter<SimplePermission[]>();
    private _permissions: SimplePermission[];
    @Input()
    public get permissions(): SimplePermission[] {
        return this._permissions;
    }
    public set permissions(value: SimplePermission[]) {
        if (this._permissions === value) return;
        this._permissions = value;
        this.permissionsDataSource.all.set(this.permissions);
    }

    tableColumns = { ...TABLE_COLUMNS } as unknown as ColumnsDescriptor;

    permissionsDataSource = new ClientDataSource([]);
    permissionsAdapter = new DataAdapter(this.permissionsDataSource, "_id");

    constructor(
        public readonly permissionsService: PermissionsService,
        private readonly cdRef: ChangeDetectorRef,
    ) {
        this.permissions = [];
    }

    private readonly promptService = inject(PromptService);
    async editFilters(permission: SimplePermission) {
        if (permission.builtIn) return;

        const v = JSON.stringify(permission.selectors ?? {}, null, 2);
        const filtersStr = await this.promptService.open({
            view: "textarea",
            title: "Edit Filters",
            value: v,
            no: "Cancel",
            yes: "Update",
            text: "Please enter the filters for this permission",
            placeholder: JSON.stringify({ query: { "createdBy.email": "$msg.principle.email" } }, null, 2),
        });
        if (!filtersStr || v === filtersStr) return;
        try {
            const filters = JSON.parse(filtersStr);
            await this.updatePermissionFilters(permission, filters);
        } catch (error) {
            console.error(error);
        }
    }
    async updatePermissionFilters(permission: SimplePermission, selectors: Omit<AuthorizeMessage, "principle">) {
        if (permission.selectors === selectors) return;
        permission.selectors = selectors;
        await this._updatePermission(permission);
    }

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

    private async _updatePermission(permission) {
        const res = await this.permissionsService.addOrUpdatePermission(permission);
        // const idx = this.permissionsDataSource.all.findIndex((p) => p._id === permission._id);
        // this.permissionsDataSource.all[idx] = res;
        // this.permissionsChange.emit(this.permissionsDataSource.all);
        this.cdRef.markForCheck();
    }

    async changeType(permission: any, target: EventTarget) {
        const by = (target as HTMLInputElement).value as string;
        if (permission.by === by) return;

        permission.by = by;
        permission.value = permission.value ?? "";
        permission.access = permission.access ?? undefined;
        await this._updatePermission(permission);
    }

    async changeValue(permission: any, target: EventTarget | HTMLInputElement) {
        const value = (target as HTMLInputElement).value;
        if (permission.value === value) return;
        permission.value = value.trim();
        await this._updatePermission(permission);
    }

    async changeAccess(permission: SimplePermission, target: EventTarget) {
        let access = (target as HTMLInputElement).value as unknown | AccessType | "";

        if (permission.access === access) return;
        if (access === "" || (access !== "deny" && access !== "grant")) access = undefined;

        permission.access = access === "" ? undefined : (access as AccessType);
        await this._updatePermission(permission);
    }

    async onTableAction(e: ActionEvent) {
        const action = e.action.name;
        switch (action) {
            case "delete": {
                await this.permissionsService.deletePermission(e.data[0]);
                this.cdRef.markForCheck();
                this.permissionsChange.emit(this.permissionsDataSource.all());
                break;
            }
            default:
                break;
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

const PERMISSIONS_TYPES = () =>
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
