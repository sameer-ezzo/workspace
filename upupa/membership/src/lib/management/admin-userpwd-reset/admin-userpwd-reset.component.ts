import { Component, inject, input, Input, model, SimpleChanges } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";
import { User } from "@upupa/auth";
import { ActionEvent } from "@upupa/common";
import { DynamicFormComponent, Field, FormScheme, checkboxField, hiddenField } from "@upupa/dynamic-form";
import { UsersService } from "../users.service";
import { passwordField } from "../../default-values";
import { DialogRef, DialogWrapperComponent } from "@upupa/dialog";
import { MatButtonModule } from "@angular/material/button";

@Component({
    standalone: true,
    selector: "admin-userpwd-reset",
    templateUrl: "./admin-userpwd-reset.component.html",
    styleUrls: ["./admin-userpwd-reset.component.scss"],
    imports: [DynamicFormComponent, MatButtonModule],
})
export class AdminUserPasswordRestComponent {
    users = inject(UsersService);
    dialogRef = inject(DialogRef);

    formScheme: FormScheme = {
        email: hiddenField("email"),
        new_password: { ...passwordField, inputs: { label: "New Password" } } as Field,
        forceChangePwd: checkboxField("forceChangePwd", "Force user to change password"),
    };

    loading: boolean;
    user = input.required<User | { email: string }>();
    value = model({ email: "", new_password: "", forceChangePwd: true });

    ngOnChanges(changes: SimpleChanges) {
        if (changes['user']) {
            this.value.set({ ...this.value(), email: this.user().email });
        }
    }
    discard() {
        this.dialogRef?.close();
    }
    async reset() {
        try {
            this.loading = true;
            const { result } = await this.users.adminResetPwd(this.value());
            this.dialogRef.close(result);
        } catch (err) {
            console.error(err);
        } finally {
            this.loading = false;
        }
    }
}
