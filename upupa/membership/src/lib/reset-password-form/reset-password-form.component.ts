import { Component, Input, Output, EventEmitter, Optional, Inject, ViewChild } from "@angular/core";
import { AuthService } from "@upupa/auth";
import { DynamicFormComponent, FormScheme, hiddenField } from "@upupa/dynamic-form";
import { passwordField } from "../default-values";
import { MEMBERSHIP_OPTIONS } from "../di.token";
import { MembershipOptions } from "../types";
import { MatButtonModule } from "@angular/material/button";

@Component({
    standalone: true,
    selector: "reset-password-form",
    templateUrl: "./reset-password-form.component.html",
    styleUrls: ["./reset-password-form.component.scss"],
    imports: [DynamicFormComponent, MatButtonModule],
})
export class ResetPasswordFormComponent {
    redirectPath: string;
    loading = false;

    @ViewChild("resetPwdForm") form: DynamicFormComponent;
    value = { name: "", password: "", confirmPassword: "", reset_token: "" };
    fields: FormScheme = {
        reset_token: hiddenField("reset_token"),
        password: passwordField,
    };

    @Input() reset_token: string;

    @Output() success = new EventEmitter();
    @Output() fail = new EventEmitter();

    constructor(
        @Optional() @Inject(MEMBERSHIP_OPTIONS) public options: MembershipOptions,
        public auth: AuthService,
    ) {}

    async send(form: DynamicFormComponent) {
        if (form.invalid) return;
        this.loading = true;

        try {
            const res = await this.auth.reset_password(this.value.password, this.reset_token);
            this.success.emit(res);
        } catch (error) {
            console.error(error);
            this.fail.emit(error);
        } finally {
            this.loading = false;
        }
    }
}
