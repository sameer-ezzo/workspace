import { inject } from "@angular/core";
import { DataAdapter, DataService } from "@upupa/data";
import { formInput } from "@upupa/dynamic-form";
import { DialogRef, SnackBarService } from "@upupa/dialog";
import { HttpErrorResponse } from "@angular/common/http";

export class EditUserRolesFromViewModel {
    constructor(self: Partial<EditUserRolesFromViewModel>) {
        Object.assign(this, self);
    }
    @formInput({ input: "hidden" })
    _id: string;
    @formInput({ input: "chips", label: "Roles", adapter: { type: "api", path: "role", keyProperty: "_id", displayProperty: "name" } })
    roles: string[];

    async onSubmit() {
        const snack = inject(SnackBarService);
        const data = inject(DataService);
        const dialogRef = inject(DialogRef, { optional: true });

        const adapter = inject(DataAdapter);
        try {
            const { document } = await data.patch(`/user/${this._id}`, [{ op: "replace", path: "/roles", value: this.roles }]);
            adapter.refresh();
            if (dialogRef) dialogRef.close({ submitResult: document });
        } catch (e) {
            const error = e instanceof HttpErrorResponse ? e.error : e;
            snack.openFailed("Failed to save user", error);
        }
    }
}
