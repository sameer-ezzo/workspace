import { Component, OnInit, Input, Output, EventEmitter, Inject, Optional, ComponentRef } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { ApiDataSource, DataAdapter, DataService } from "@upupa/data";
import { AuthService } from "@upupa/auth";
import { ActionDescriptor, ActionEvent, toTitleCase } from "@upupa/common";
import { ColumnsDescriptor, DataTableComponent, TableHeaderComponent } from "@upupa/table";
import { USERS_MANAGEMENT_OPTIONS } from "../di.token";
import { UsersManagementOptions, defaultRolesListActions, defaultRolesListColumns, defaultRolesListHeaderActions } from "../types";
import { RoleFormComponent } from "../role-form/role-form.component";
import { firstValueFrom } from "rxjs";
import { ConfirmService, DialogService, SnackBarService } from "@upupa/dialog";
import { MatBtnComponent } from "@upupa/mat-btn";

@Component({
    standalone: true,
    selector: "roles-list",
    templateUrl: "./roles-list.component.html",
    styleUrls: ["./roles-list.component.css"],
    imports: [DataTableComponent, TableHeaderComponent, MatBtnComponent],
})
export class RolesListComponent implements OnInit {
    focusedUser: any;
    constructor(
        public data: DataService,
        @Optional()
        @Inject(USERS_MANAGEMENT_OPTIONS)
        private options: UsersManagementOptions,
        public http: HttpClient,
        public auth: AuthService,
        public snack: SnackBarService,
        public confirm: ConfirmService,
        public dialog: DialogService,
    ) {}

    @Input() primary: string;
    @Input() accent: string;

    @Input() columns: ColumnsDescriptor;
    @Input() headerActions: ActionDescriptor[];
    @Input() actions: ActionDescriptor[];
    @Output() action = new EventEmitter<ActionEvent>();

    @Input() adapter: DataAdapter<any>;
    loading = false;

    ngOnInit() {
        const _options = this.options.lists?.roles;
        this.columns = _options?.columns || defaultRolesListColumns;
        this.headerActions = (_options?.headerActions || defaultRolesListHeaderActions) as ActionDescriptor[];
        this.actions = (_options?.rowActions || defaultRolesListActions) as ActionDescriptor[];

        const select = [...new Set(["name"].concat(...Object.keys(this.columns)))]; // ['name', 'email', 'phone', 'username', 'claims', 'emailVerified', 'phoneVerified'];
        const dataSource = new ApiDataSource<any>(this.data, "/role", select);

        this.adapter = new DataAdapter(dataSource, "_id", "email", "_id", null, {
            page: { pageIndex: 0, pageSize: 15 },
            sort: { active: "date", direction: "desc" },
            terms: [{ field: "email", type: "like" }],
        });
        this.adapter.refresh();
    }

    async onAction(e: ActionEvent) {
        this.action.emit(e);
        if (e.action === null) return;

        this.loading = true;
        let task: Promise<any>;
        const roles = e.data;
        const role = roles?.length ? roles[0] : null;

        switch (e.action.name) {
            case "create":
            case "edit": {
                const data = {
                    inputs: { role: role },
                    title: `${toTitleCase(e.action.name)} Role`,
                    dialogActions: [
                        {
                            name: "cancel",
                            type: "button",
                            text: "Discard",
                            variant: "stroked",
                        },
                        {
                            path: "api/role",
                            Action: e.action.name === "edit" ? "Update" : "Create",
                            variant: "raised",
                            type: "submit",
                            name: "submit",
                            text: "Submit",
                            color: "primary",
                        },
                    ],
                } as any;
                const dialogRef = this.dialog.open(RoleFormComponent, { ...data });
                const componentRef: ComponentRef<RoleFormComponent> = await firstValueFrom(dialogRef.afterAttached());
                // dialogRef.componentInstance.actionClick.subscribe((e) => {
                //     componentRef.instance.onAction(e);
                // });

                const res = await firstValueFrom(dialogRef.afterClosed());
                if (!res) return;
                await this.data.refreshCache("/role");
                this.adapter.refresh();
                break;
            }
            case "delete": {
                const res = await this.confirm.openWarning({
                    title: "Delete role",
                    confirmText: "Do you really want to delete this role permanently?",
                    yes: "Delete it",
                    no: "Keep it",
                });

                if (!res) return;
                await this.data.delete(`/role/${role._id}`);
                this.snack.openSuccess("Role deleted!");
                await this.data.refreshCache("/role");
                this.adapter.refresh();
                break;
            }
        }
    }

    async banUser(id: string, lock = true) {
        const baseUrl = this.auth.baseUrl;
        await firstValueFrom(this.http.post(`${baseUrl}/lock`, { id, lock }));
        return true;
    }
}
