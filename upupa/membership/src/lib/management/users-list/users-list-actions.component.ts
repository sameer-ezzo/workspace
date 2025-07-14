import { Component, inject, computed, Injector, DOCUMENT } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { DataService } from "@upupa/data";
import { AuthService, UserBase } from "@upupa/auth";
import { ActionDescriptor, ActionEvent } from "@upupa/common";
import { DataTableComponent, DefaultTableCellTemplate } from "@upupa/table";
import { firstValueFrom } from "rxjs";
import { AdminUserPasswordRestComponent } from "../admin-userpwd-reset/admin-userpwd-reset.component";
import { ConfirmService, DialogService, SnackBarService } from "@upupa/dialog";

import { MatIconModule } from "@angular/material/icon";
import { MatBtnComponent } from "@upupa/mat-btn";
import { openFormDialog } from "@upupa/cp";

import { EditUserRolesFromViewModel } from "../edit-user-roles/edit-user-roles.forms";

@Component({
    selector: "impersonate-user-button",
    template: ` <mat-btn class="action" [buttonDescriptor]="btn" [data]="[item()]" (action)="onAction($event)"></mat-btn> `,
    imports: [MatIconModule, MatBtnComponent]
})
export class ImpersonateUserButton extends DefaultTableCellTemplate {
    table = inject(DataTableComponent);
    adapter = this.table.adapter();

    public readonly auth = inject(AuthService);
    private readonly doc = inject(DOCUMENT);
    btn = { path: "auth", action: "Impersonate User", variant: "icon", name: "impersonate", icon: "theater_comedy" } as ActionDescriptor;
    async onAction(e: ActionEvent) {
        try {
            await this.auth.impersonate(this.item()._id);
            setTimeout(() => {
                this.doc.location.reload();
            }, 250);
        } catch (error) {
            console.error(error);
        }
    }
}

@Component({
    selector: "change-user-roles-button",
    template: `<mat-btn class="action" [buttonDescriptor]="btn" [data]="[item()]" (action)="onAction($event)"></mat-btn> `,
    imports: [MatIconModule, MatBtnComponent]
})
export class ChangeUserRolesButton extends DefaultTableCellTemplate {
    table = inject(DataTableComponent);
    adapter = this.table.adapter();
    dialog = inject(DialogService);
    snack = inject(SnackBarService);
    injector = inject(Injector);
    btn = {
        path: "auth",
        action: "Change User Roles",
        variant: "icon",
        text: "Change roles",
        name: "change-user-roles",
        icon: "group",
        menu: true,
    } as ActionDescriptor;

    async onAction(e: ActionEvent) {
        const value = new EditUserRolesFromViewModel({ _id: this.item()._id, roles: this.item().roles });
        const { dialogRef } = await openFormDialog(EditUserRolesFromViewModel, value, { dialogOptions: { title: "User Roles" }, injector: this.injector, defaultAction: true });
        const { submitResult } = await firstValueFrom(dialogRef.afterClosed());
        console.log("result", submitResult);

        if (submitResult) {
            this.snack.openSuccess("User roles have been changed!");
            await this.adapter.refresh();
            dialogRef.close();
        }
    }
}

@Component({
    selector: "reset-password-user-button",
    template: ` <mat-btn class="action" [buttonDescriptor]="btn" [data]="[item()]" (action)="onAction($event)"></mat-btn> `,
    imports: [MatIconModule, MatBtnComponent]
})
export class ResetPasswordButton extends DefaultTableCellTemplate {
    table = inject(DataTableComponent);
    adapter = this.table.adapter();
    dialog = inject(DialogService);
    snack = inject(SnackBarService);
    btn = { path: "auth", variant: "icon", text: "Reset password", name: "reset", icon: "password", menu: true } as ActionDescriptor;
    async onAction(e: ActionEvent) {
        const dialogRef = this.dialog.open(
            { component: AdminUserPasswordRestComponent, inputs: { user: this.item() } },
            {
                title: "Reset Password",
            },
        );
        const { result } = await firstValueFrom(dialogRef.afterClosed());
        console.log("result", result);

        if (result) {
            this.snack.openSuccess("Password has been reset!");
            await this.adapter.refresh();
            dialogRef.close();
        }
    }
}

@Component({
    selector: "delete-user-button",
    template: ` <mat-btn class="action" [buttonDescriptor]="btn" [data]="[item()]" (action)="onAction($event)"></mat-btn> `,
    imports: [MatIconModule, MatBtnComponent]
})
export class DeleteUserButton extends DefaultTableCellTemplate {
    table = inject(DataTableComponent);
    adapter = this.table.adapter();

    public readonly snack = inject(SnackBarService);
    public readonly confirm = inject(ConfirmService);

    btn = { variant: "icon", text: "Delete User", name: "delete", icon: "delete", color: "warn", menu: true } as ActionDescriptor;
    async onAction(e: ActionEvent) {
        const user = this.item();
        if (user.roles?.indexOf("super-admin") > -1) {
            this.snack.openFailed("You cannot delete a super admin user!");
            return;
        }
        const d = {
            title: "Delete user",
            confirmText: "Do you really want to delete this user permanently?",
            yes: "Delete it",
            no: "Keep it",
        };
        if (!(await this.confirm.openWarning(d))) return;
        await this.adapter.delete(user);
        this.snack.openSuccess("User deleted!");
    }
}

@Component({
    selector: "ban-user-button",
    template: ` <mat-btn class="action" [buttonDescriptor]="btn()" [data]="[item()]" (action)="onAction($event)"></mat-btn> `,
    imports: [MatIconModule, MatBtnComponent]
})
export class BanUserButton extends DefaultTableCellTemplate {
    table = inject(DataTableComponent);
    adapter = this.table.adapter();

    public readonly http = inject(HttpClient);
    public readonly auth = inject(AuthService);
    public readonly data = inject(DataService);
    public readonly snack = inject(SnackBarService);
    readonly confirm = inject(ConfirmService);

    btn = computed(() => {
        const disabled = this.item().disabled;
        if (!disabled) return { variant: "icon", text: "Ban user", name: "ban", icon: "lock", color: "warn" } as ActionDescriptor;
        else return { variant: "icon", text: "Unban user", name: "unban", icon: "lock_open", color: "accent" } as ActionDescriptor;
    });
    async onAction(e: ActionEvent) {
        const user = this.item();
        const id: string = user._id;
        const lock = !user.disabled;

        if (
            await this.confirm.openWarning({
                title: lock === true ? "Ban user" : "Unban user",
                confirmText:
                    lock === true
                        ? "Banning a user will halt all their current activities. Are you sure you want to proceed with this action?"
                        : "Unbanning a user will allow them to continue using the platform. Are you sure you want to proceed with this action?",
                yes: lock === true ? "Yes, Ban" : "Yes, Unban",
                no: "Discard",
            })
        ) {
            const baseUrl = this.auth.baseUrl;
            const { document } = await firstValueFrom(this.http.post<{ document: UserBase }>(`${baseUrl}/lock`, { id, lock }));
            await this.adapter.refresh();
            if (document.disabled) this.snack.openSuccess(`User ${this.item().email} has been banned`);
            else this.snack.openSuccess(`User ${this.item().email} has been unbanned`);
        }
    }
}
