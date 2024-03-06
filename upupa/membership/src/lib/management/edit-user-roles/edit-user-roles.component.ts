import { Component, Input, SimpleChanges, ViewChild } from '@angular/core';

import { AuthService } from '@upupa/auth';

import { firstValueFrom } from 'rxjs';
import { DataAdapter, DataService, ObjectId, ServerDataSource } from '@upupa/data';
import { MatDialogRef } from '@angular/material/dialog';
import { DynamicFormComponent, FormScheme, selectField } from '@upupa/dynamic-form';
import { HttpClient } from '@angular/common/http';
import { ActionDescriptor, ActionEvent, UpupaDialogComponent } from '@upupa/common';
@Component({
    selector: 'edit-user-roles',
    templateUrl: './edit-user-roles.component.html',
    styleUrls: ['./edit-user-roles.component.scss']
})
export class EditUserRolesComponent {
    @ViewChild('userForm') form: DynamicFormComponent
    loading = false;

    @Input() user: any = { _id: ObjectId.generate() };

    @Input() actions: ActionDescriptor[] = []
    @Input() mode: 'edit' | 'create' = 'create'


    fields: FormScheme;
    constructor(
        public auth: AuthService,
        public data: DataService,
        private http: HttpClient) {
        this.fields = {
            roles: selectField('roles', 'Roles', new DataAdapter(
                new ServerDataSource(this.data, 'role', ['_id', 'name']),
                '_id', 'name', undefined, undefined
            ), 'User roles', undefined, 'outline', 10000, [{ name: 'required' }])
        }
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
            return await firstValueFrom(this.http.post<{ userId: string, roles: string[] }>(`${this.auth.baseUrl}/updateusertoroles`, { userId: this.user._id, roles: this.value.roles })).then(x => x.roles)
        } catch (err) {
            console.error(err)
        }
        return []
    }



    private async onAction(e: ActionEvent, dialogRef: MatDialogRef<UpupaDialogComponent>) {
        let roles = this.value.roles
        if (e.action.name === 'save') {
            roles = await this.save(this.form)
        }
        dialogRef.close(roles)
    }

}