import { Component, Input, SimpleChanges, ViewChild, signal } from '@angular/core';

import { AuthService } from '@upupa/auth';

import { firstValueFrom } from 'rxjs';
import { DataAdapter, DataService, ObjectId, ServerDataSource } from '@upupa/data';
import { MatDialogRef } from '@angular/material/dialog';
import { DynamicFormComponent, FormScheme, selectField } from '@upupa/dynamic-form';
import { HttpClient } from '@angular/common/http';
import { ActionDescriptor } from '@upupa/common';
import { UpupaDialogComponent, UpupaDialogPortal } from '@upupa/dialog';
@Component({
    selector: 'edit-user-roles',
    templateUrl: './edit-user-roles.component.html',
    styleUrls: ['./edit-user-roles.component.scss']
})
export class EditUserRolesComponent implements UpupaDialogPortal<EditUserRolesComponent> {
    @ViewChild('userForm') form: DynamicFormComponent
    dialogRef: MatDialogRef<UpupaDialogComponent<EditUserRolesComponent>>;

    loading = false;

    @Input() user: any = { _id: ObjectId.generate() };

    @Input() actions: ActionDescriptor[] = []
    @Input() mode: 'edit' | 'create' = 'create'


    scheme = signal<FormScheme>(null);
    constructor(
        public auth: AuthService,
        public data: DataService,
        private http: HttpClient) {
        this.scheme.set({
            roles: selectField('roles', 'Roles', new DataAdapter(
                new ServerDataSource(this.data, 'role', ['_id', 'name']),
                '_id', 'name', undefined, undefined
            ), 'User roles', undefined, 'outline', 10000, [{ name: 'required' }])
        })
    }

    value: { roles: string[] } = { roles: [] }
    async ngOnChanges(changes: SimpleChanges): Promise<void> {

        if (this.user && this.user._id === null) {
            throw "Invalid user object passed to component";
        }
        this.value = await firstValueFrom(this.data.get<{ roles: string[] }>(`/user/${this.user._id}?select=_id,roles`))

    }

    async save(form: DynamicFormComponent): Promise<string[]> {

        if (!form.getDirtyValue()) return []
        try {
            const res = await firstValueFrom(
                this.http.post<{ userId: string, roles: string[] }>(`${this.auth.baseUrl}/changeuserroles`,
                    { userId: this.user._id, roles: this.value.roles })
            )
            this.dialogRef.close(res.roles)
        } catch (err) {
            console.error(err)
        }
        return []
    }

}