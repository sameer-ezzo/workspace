import { DatePipe } from "@angular/common";
import { inject } from "@angular/core";
import { closeDialog, editButton } from "@upupa/cp";
import { DataAdapter, DataService } from "@upupa/data";
import { formInput } from "@upupa/dynamic-form";
import { EmailColumnCellComponent } from "./email-column-cell.component";
import { ImpersonateUserButton, ResetPasswordButton, BanUserButton, DeleteUserButton, ChangeUserRolesButton } from "./users-list-actions.component";
import { DialogRef, SnackBarService } from "@upupa/dialog";
import { column } from "@upupa/table";
import { HttpErrorResponse } from "@angular/common/http";
import { AuthService } from "@upupa/auth";

export class CreateUserFromViewModel {
    @formInput({ input: "hidden" })
    _id: string;
    @formInput({ input: "email", label: "Email", required: true })
    email: string;
    @formInput({ input: "text", label: "Username", required: true })
    name: string;
    @formInput({ input: "password", label: "Password", required: true })
    password = "";
    @formInput({ input: "switch", label: "Force change password" })
    forceChangePwd: boolean;

    async onSubmit() {
        const snack = inject(SnackBarService);
        const auth = inject(AuthService);
        const dialogRef = inject(DialogRef, { optional: true });

        const adapter = inject(DataAdapter);
        try {
            const { document } = await auth.signup({ email: this.email, name: this.name, forceChangePwd: this.forceChangePwd }, this.password);
            adapter.refresh();
            if (dialogRef) dialogRef.close({ submitResult: document });
        } catch (e) {
            const error = e instanceof HttpErrorResponse ? e.error : e;
            snack.openFailed("Failed to save user", error);
        }
    }
}
export class EditUserFromViewModel {
    @formInput({ input: "hidden" })
    _id: string;
    // @formInput({ input: "email", label: "Email", required: true, readonly: true })
    // email: string;
    @formInput({ input: "text", label: "Full name", required: true })
    name: string;

    async onSubmit() {
        const snack = inject(SnackBarService);
        const data = inject(DataService);
        const dialogRef = inject(DialogRef, { optional: true });
        const adapter = inject(DataAdapter);
        try {
            const { document } = await data.patch(`/user/${this._id}`, [{ op: "replace", path: "name", value: this.name }]);
            adapter.refresh();
            if (dialogRef) dialogRef.close({ submitResult: document });
        } catch (e) {
            const error = e instanceof HttpErrorResponse ? e.error : e;
            snack.openFailed("Failed to save user", error);
        }
    }
}

export class UserListViewModel {
    @column({ visible: false })
    select = false;
    @column({ header: "Email", template: [{ component: EmailColumnCellComponent }] })
    email: string;

    @column({ header: "Full Name" })
    name: string;

    @column({ header: "Roles", sortDisabled: true })
    roles: any[];

    @column({ header: "Last Log in", pipe: { pipe: DatePipe, args: ["medium"] } })
    lastLogin: Date;

    @column({
        header: " ",
        template: [ImpersonateUserButton, editButton(EditUserFromViewModel, { updateAdapter: false }), ChangeUserRolesButton, ResetPasswordButton, BanUserButton, DeleteUserButton],
    })
    actions: any;
}
