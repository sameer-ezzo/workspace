import { Component, Input, SimpleChanges, ViewChild, signal } from "@angular/core";

import { AuthService } from "@upupa/auth";

import { firstValueFrom, map } from "rxjs";
import { DataAdapter, DataService, ObjectId, ApiDataSource } from "@upupa/data";
import { MatDialogRef } from "@angular/material/dialog";
import { DynamicFormComponent, FormScheme, selectField } from "@upupa/dynamic-form";
import { HttpClient } from "@angular/common/http";
import { ActionDescriptor } from "@upupa/common";
import { DialogWrapperComponent, DialogPortal } from "@upupa/dialog";
import { MatButtonModule } from "@angular/material/button";
@Component({
    standalone: true,
    selector: "edit-user-roles",
    templateUrl: "./edit-user-roles.component.html",
    styleUrls: ["./edit-user-roles.component.scss"],
    imports: [DynamicFormComponent, MatButtonModule],
})
export class EditUserRolesComponent implements DialogPortal<EditUserRolesComponent> {
    @ViewChild("userForm") form: DynamicFormComponent;
    dialogRef: MatDialogRef<DialogWrapperComponent<EditUserRolesComponent>>;

    loading = false;

    @Input() user: any = { _id: ObjectId.generate() };

    @Input() actions: ActionDescriptor[] = [];
    @Input() mode: "edit" | "create" = "create";

    scheme = signal<FormScheme>(null);
    constructor(
        public auth: AuthService,
        public data: DataService,
        private http: HttpClient,
    ) {
        this.scheme.set({
            roles: selectField(
                "roles",
                "Roles",
                new DataAdapter(new ApiDataSource(this.data, "role", ["_id", "name"]), "_id", "name", undefined, undefined),
                "User roles",
                undefined,
                "outline",
                10000,
                [{ name: "required" }],
            ),
        });
    }

    value: { roles: string[] } = { roles: [] };
    async ngOnChanges(changes: SimpleChanges): Promise<void> {
        if (this.user && this.user._id === null) {
            throw "Invalid user object passed to component";
        }
        this.value = await firstValueFrom(this.data.get<{ roles: string[] }>(`/user/${this.user._id}?select=_id,roles`).pipe(map((res) => res.data?.[0] ?? { roles: [] })));
    }

    async save(form: DynamicFormComponent): Promise<string[]> {
        try {
            const res = await firstValueFrom(
                this.http.post<{ userId: string; roles: string[] }>(`${this.auth.baseUrl}/changeuserroles`, { userId: this.user._id, roles: this.value.roles }),
            );
            this.dialogRef.close(res.roles);
        } catch (err) {
            console.error(err);
        }
        return [];
    }
}
