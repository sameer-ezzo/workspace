import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output } from "@angular/core";
import { DataAdapter, ClientDataSource } from "@upupa/data";
import { ActionDescriptor, ActionEvent } from "@upupa/common";
import { AccessType, SimplePermission, _NullPermissionTypes, _ObjectPermissionTypes, _StringPermissionTypes } from "@noah-ark/common";
import { PermissionsService } from "../permissions.service";
import { ColumnsDescriptor } from "@upupa/table";

@Component({
    selector: "rule-permissions-table",
    templateUrl: "./rule-permissions-table.component.html",
    styleUrls: ["./rule-permissions-table.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RulePermissionsTableComponent {
    focused: any;
    permissionTypes = PERMISSIONS_TYPES;
    @Input() action: string;
    @Output() permissionsChange = new EventEmitter<SimplePermission[]>()
    private _permissions: SimplePermission[];
    @Input()
    public get permissions(): SimplePermission[] {
        return this._permissions;
    }
    public set permissions(value: SimplePermission[]) {
        if (this._permissions === value) return;
        this._permissions = value;
        this.permissionsDataSource.all = this.permissions;
    }

    tableColumns = { ...TABLE_COLUMNS } as unknown as ColumnsDescriptor

    permissionsDataSource = new ClientDataSource([]);
    permissionsAdapter = new DataAdapter(this.permissionsDataSource, "_id");

    constructor(public readonly permissionsService: PermissionsService,
        private readonly cdRef: ChangeDetectorRef) { }





    tableActions = (item) => {
        return item?.builtIn === true ? [] : [
            {

                name: "delete",
                variant: "icon",
                icon: "delete",
                color: "warn",

            } as ActionDescriptor,
        ]
    };


    private async _updatePermission(permission) {
        const res = await this.permissionsService.addOrUpdatePermission(permission);
        const idx = this.permissionsDataSource.all.findIndex(p => p._id === permission._id)
        this.permissionsDataSource.all[idx] = res
        this.permissionsChange.emit(this.permissionsDataSource.all)
        this.cdRef.markForCheck()
    }

    async changeType(permission: any, target: EventTarget) {
        const by = (target as HTMLInputElement).value as string;
        if (permission.by === by) return

        permission.by = by;
        permission.value = permission.value ?? "";
        permission.access = permission.access ?? undefined;
        await this._updatePermission(permission)
    }

    async changeValue(permission: any, target: EventTarget | HTMLInputElement) {
        const value = (target as HTMLInputElement).value;
        if (permission.value === value) return;
        permission.value = value.trim()
        await this._updatePermission(permission)
    }

    async changeAccess(permission: SimplePermission, target: EventTarget) {
        let access = (target as HTMLInputElement).value as unknown | AccessType | ''

        if (permission.access === access) return;
        if (access === '' || (access !== 'deny' && access !== 'grant')) access = undefined

        permission.access = access === '' ? undefined : access as AccessType
        await this._updatePermission(permission)
    }


    async onTableAction(e: ActionEvent) {
        const action = e.action.name;
        switch (action) {
            case "delete": {
                await this.permissionsService.deletePermission(e.data[0])
                this.permissionsDataSource.all = this.permissionsDataSource.all.filter(p => p._id !== e.data[0]._id)
                this.cdRef.markForCheck()
                this.permissionsChange.emit(this.permissionsDataSource.all)
                break;
            }
            default:
                break;
        }
    }
}

const TABLE_COLUMNS = {
    select: 0,
    type: { header: "Type", width: '120px' },
    value: { header: "Value" },
    access: { header: "Access", width: '60px' },
} as unknown as ColumnsDescriptor


const PERMISSIONS_TYPES = [
    { value: "anonymous", display: "Visitor" },
    { value: "user", display: "Logged in user" },
    { value: "emv", display: "User with verified email" },
    { value: "phv", display: "User with verified phone" },
    { value: "role", display: "User with specific role" },
    { value: "email", display: "User with specific email" },
    { value: "phone", display: "User with specific phone" },
    { value: "claim", display: "User with specific claim" },
];
