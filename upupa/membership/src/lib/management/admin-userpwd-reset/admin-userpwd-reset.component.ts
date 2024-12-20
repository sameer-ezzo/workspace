import { Component, Input } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";
import { User } from "@upupa/auth";
import { ActionEvent } from "@upupa/common";
import { DynamicFormComponent, Field, FormScheme, checkboxField, hiddenField } from "@upupa/dynamic-form";
import { UsersService } from "../users.service";
import { passwordField } from "../../default-values";
import { DialogWrapperComponent } from "@upupa/dialog";
import { MatButtonModule } from "@angular/material/button";

@Component({
    standalone: true,
    selector: "admin-userpwd-reset",
    templateUrl: "./admin-userpwd-reset.component.html",
    styleUrls: ["./admin-userpwd-reset.component.scss"],
    imports: [DynamicFormComponent, MatButtonModule],
})
export class AdminUserPasswordRestComponent {
    formScheme: FormScheme = {
        email: hiddenField("email"),
        new_password: { ...passwordField, inputs: { label: "New Password" } } as Field,
        forceChangePwd: checkboxField("forceChangePwd", "Force user to change password"),
    };

    loading: boolean;
    private _user: User | { email: string };
    @Input()
    public get user(): User | { email: string } {
        return this._user;
    }
    public set user(v: User | { email: string }) {
        this._user = v;
        this.value.email = v.email;
    }

    value = { email: "", new_password: "", forceChangePwd: true };

    constructor(public users: UsersService) {}

    dialogRef: MatDialogRef<DialogWrapperComponent>;
    async onAction(e: ActionEvent, dialogRef: MatDialogRef<DialogWrapperComponent>) {
        if (e.action.name === "reset") {
            const res = await this.reset();
            dialogRef.close(res);
        } else dialogRef.close(null);
    }

    discard() {
        this.dialogRef?.close();
    }
    async reset() {
        try {
            this.loading = true;
            const { result } = await this.users.adminResetPwd(this.value);
            this.dialogRef.close(result);
        } catch (err) {
            console.error(err);
        } finally {
            this.loading = false;
        }
    }
}
