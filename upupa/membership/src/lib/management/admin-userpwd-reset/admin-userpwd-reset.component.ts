import { Component, Input } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { User } from '@upupa/auth';
import { ActionEvent, UpupaDialogComponent } from '@upupa/common';
import { FieldItem, FormScheme, checkboxField, hiddenField, switchField } from '@upupa/dynamic-form';
import { UsersService } from '../users.service';
import { passwordField } from '../../default-values';

@Component({
    selector: 'admin-userpwd-reset',
    templateUrl: './admin-userpwd-reset.component.html',
    styleUrls: ['./admin-userpwd-reset.component.scss']
})
export class AdminUserPasswordRestComponent {

    formScheme: FormScheme = {
        email: hiddenField("email"),
        new_password: { ...passwordField, name: 'new_password', ui: { inputs: { label: 'New Password' } } } as FieldItem,
        forceChangePwd: checkboxField('forceChangePwd', 'Force user to change password')
    }

    loading: boolean;
    private _user: User | { email: string };
    @Input()
    public get user(): User | { email: string } {
        return this._user;
    }
    public set user(v: User | { email: string }) {
        this._user = v;
        this.value.email = v.email
    }

    value = { email: '', new_password: '', forceChangePwd: true }

    constructor(public users: UsersService) { }


    dialogRef: MatDialogRef<UpupaDialogComponent>
    async onAction(e: ActionEvent, dialogRef: MatDialogRef<UpupaDialogComponent>) {
        if (e.action.name === 'reset') {
            const res = await this.reset()
            dialogRef.close(res)
        }
        else dialogRef.close(null)
    }

    discard() {
        this.dialogRef?.close()
    }
    async reset() {
        try {
            this.loading = true;
            const { result } = await this.users.adminResetPwd(this.value)
            this.dialogRef.close(result)

        } catch (err) {
            console.error(err)
        } finally {
            this.loading = false;
        }
    }

}