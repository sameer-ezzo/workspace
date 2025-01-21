import { DatePipe } from "@angular/common";
import { inject } from "@angular/core";
import { editButton } from "@upupa/cp";
import { DataAdapter, DataService } from "@upupa/data";
import { formInput } from "@upupa/dynamic-form";
import { EmailColumnCellComponent } from "./email-column-cell.component";
import { ImpersonateUserButton, ResetPasswordButton, BanUserButton, DeleteUserButton } from "./users-list-actions.component";
import { DialogRef } from "@upupa/dialog";
import { column } from "@upupa/table";

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
}
export class EditUserFromViewModel {
    @formInput({ input: "hidden" })
    _id: string;
    // @formInput({ input: "email", label: "Email", required: true, readonly: true })
    // email: string;
    @formInput({ input: "text", label: "Username", required: true })
    name: string;

    async onSubmit() {
        const dialog = inject(DialogRef);
        const data = inject(DataService);
        const adapter = inject(DataAdapter);
        try {
            // do not use adapter.put because it will fail with violation of unique constraint on (email, username)
            const { document } = await data.patch(`/user/${this._id}`, [{ op: "replace", path: "name", value: this.name }]);
            adapter.refresh();
            dialog.close({ submitResult: document });
        } catch (e) {
            console.error(e);
        }
    }
}

export class UserListViewModel {
    @column({ header: "Email", template: [{ component: EmailColumnCellComponent }] })
    email: string;

    @column({ header: "Full Name" })
    name: string;

    @column({ header: "Last Log in", pipe: { pipe: DatePipe, args: ["medium"] } })
    lastLogin: Date;

    @column({ header: "Roles", sortDisabled: true })
    roles: any[];

    @column({ header: " ", template: [ImpersonateUserButton, editButton(EditUserFromViewModel, { updateAdapter: false }), ResetPasswordButton, BanUserButton, DeleteUserButton] })
    actions: any;
}
