import { Component, inject, Input, signal, ViewChild } from "@angular/core";

import { AuthService, User } from "@upupa/auth";

import { firstValueFrom, map } from "rxjs";
import { DataResult, DataService } from "@upupa/data";

import { HttpClient } from "@angular/common/http";
import { ActionEvent } from "@upupa/common";
import { MatDialogRef } from "@angular/material/dialog";

import { DynamicFormComponent, FormScheme } from "@upupa/dynamic-form";
import { Condition } from "@noah-ark/expression-engine";
import { DialogWrapperComponent, DialogPortal } from "@upupa/dialog";
import { MatButtonModule } from "@angular/material/button";

type UserFormOptions = {
    scheme: FormScheme;
    conditions?: Condition[];
};

@Component({
    standalone: true,
    selector: "user-form",
    templateUrl: "./user-form.component.html",
    styleUrls: ["./user-form.component.scss"],
    imports: [MatButtonModule, DynamicFormComponent],
})
export class UserFormComponent implements DialogPortal<DialogWrapperComponent> {
    @ViewChild("userForm") form: any;
    dialogRef: MatDialogRef<DialogWrapperComponent> = inject(MatDialogRef);
    private _loading = signal<boolean>(false);
    public get loading() {
        return this._loading();
    }
    public set loading(value) {
        this._loading.set(value);
    }

    scheme = signal<FormScheme>(null);
    conditions = signal<Condition[]>([]);

    private _updateInputs(mode: "editUser" | "createUser" = "createUser") {
        this.loading = true;

        this.scheme.set(this.options?.scheme);
        this.conditions.set(this.options?.conditions || []);
        this.loading = false;
    }

    _userValue = signal<Partial<User>>(null);
    @Input()
    public get user(): Partial<User> {
        return this._userValue();
    }
    public set user(v: Partial<User>) {
        this.getUser(v).then((u) => {
            this._userValue.set(u);
            this._updateInputs();
        });
    }

    errors = (form: DynamicFormComponent) =>
        Array.from(form.graph)
            .map((c) => c[1].control.errors)
            .reduce((a, b) => ({ ...a, ...b }), {});

    _options: UserFormOptions = null;
    @Input()
    get options() {
        return this._options;
    }
    set options(options: UserFormOptions) {
        if (options === this._options) return;
        this._options = options;
    }

    private async getUser(user: Partial<User>) {
        if (!user?._id) return {};
        try {
            return await firstValueFrom(this.data.get<DataResult<User>>(`/user/${user._id}`).pipe(map((u) => u.data?.[0] ?? {})));
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    constructor(
        public auth: AuthService,
        public data: DataService,
        private http: HttpClient,
    ) {}

    discard() {
        this.dialogRef?.close();
    }
    async save() {
        const form = this.form;
        const user = this.user;
        if (!form.touched || form.invalid) return;
        try {
            if (!this.user?._id) {
                const res = await this._createUser(form.value());
                this._userValue.set(res);
            } else {
                const v = form.getDirtyValue();
                if (v) await this.data.put(`/user/${this.user._id}`, v);
            }
            this.dialogRef?.close(this.user);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    private async _createUser(user) {
        const u = { ...user } as User;
        u.username = u.username ?? u.email;

        return await firstValueFrom(this.http.post<Partial<User>>(`${this.auth.baseUrl}/admincreateuser`, u));
    }

    async onAction(e: ActionEvent) {
        const dialogRef = e.context.dialogRef;
        if (e.action.name === "save") {
            try {
                await this.save();
                dialogRef.close(this.user);
            } catch (error) {}
        } else dialogRef.close();
    }
}
