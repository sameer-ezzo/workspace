import { Component, Input, Output, EventEmitter, Optional, Inject, ViewChild, output, input, inject, signal, viewChild, model, SimpleChanges } from "@angular/core";
import { AuthService } from "@upupa/auth";
import { DynamicFormComponent, FormScheme, hiddenField } from "@upupa/dynamic-form";
import { passwordField } from "../default-values";
import { MEMBERSHIP_OPTIONS } from "../di.token";
import { MembershipOptions } from "../types";
import { MatButtonModule } from "@angular/material/button";
import { ActivatedRoute, Router } from "@angular/router";
import { parseApiError } from "@upupa/common";

@Component({
    selector: "reset-password-form",
    templateUrl: "./reset-password-form.component.html",
    styleUrls: ["./reset-password-form.component.scss"],
    imports: [DynamicFormComponent, MatButtonModule],
})
export class ResetPasswordFormComponent {
    public options = inject<MembershipOptions>(MEMBERSHIP_OPTIONS, { optional: true });
    router = inject(Router);
    route = inject(ActivatedRoute);
    public auth = inject(AuthService);

    redirectPath: string;
    loading = signal(false);
    form = viewChild<DynamicFormComponent>("resetPwdForm");

    value = model<{ name: ""; password: ""; confirmPassword: ""; reset_token: "" }>();
    fields: FormScheme = {
        reset_token: hiddenField("reset_token"),
        password: passwordField,
    };

    reset_token = input<string, string>("", {
        transform: (v) => {
            console.log(v);
            return v;
        },
    });

    ngOnChanges(changes: SimpleChanges) {
        if (changes["reset_token"]) {
            const token = this.reset_token();
            if (!token) this.router.navigate(["../forgot-password"], { relativeTo: this.route });
        }
    }

    on_success = output<any>();
    on_error = output<any>();

    async send(form: DynamicFormComponent) {
        if (form.invalid) return;
        this.loading.set(true);

        try {
            const v = this.value();
            const res = await this.auth.reset_password(v.password, this.reset_token());
            this.on_success.emit(res);
        } catch (error) {
            const err = this.handleError(error);
            console.error(err);
            this.on_error.emit(err);
        } finally {
            this.loading.set(false);
        }
    }

    handleError(e) {
        const parsed = parseApiError(e);
        let err = parsed.raw;
        if (parsed.statusCode === 400) {
            // if (msg === "NEW-PASSWORD_RESET-TOKEN_REQUIRED" || msg === "TOKEN_ALREADY_USED" || msg === "INVALID_TOKEN") {

            if (parsed.code === "MISSING_EMAIL") err = { message: "Username or Email should be provided", code: 400 };
            else if (parsed.code === "INVALID_USER") err = { message: "User Can not perform this action", code: 400 };
            else if (parsed.code === "ALREADY_SENT") err = { message: "Reset password link already sent", code: 400 };
        }
        return err;
    }
}
