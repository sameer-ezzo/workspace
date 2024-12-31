import { Component, Input, inject, signal, model, output, viewChild, SimpleChanges, effect } from "@angular/core";
import { AuthService } from "@upupa/auth";
import { ActionDescriptor } from "@upupa/common";
import { CollectorComponent, ExtendedValueChangeEvent, FormScheme } from "@upupa/dynamic-form";
import { defaultForgotPasswordFormFields } from "../default-values";
import { Condition } from "@noah-ark/expression-engine";
import { FormControl } from "@angular/forms";

@Component({
    standalone: true,
    selector: "forgot-password-form",
    templateUrl: "./forgot-password-form.component.html",
    styleUrls: ["./forgot-password-form.component.scss"],
    imports: [CollectorComponent],
})
export class ForgotPasswordFormComponent {
    control = new FormControl();
    loginForm = viewChild<CollectorComponent>("loginForm");
    private readonly auth = inject(AuthService);
    loading = signal(false);
    error: string;
    success = output<any>();
    fail = output<any>();

    model = model<{ email: "" }>();
    @Input() submitBtn: ActionDescriptor = { name: "submit", type: "submit", text: "Submit", color: "primary", variant: "raised" };
    @Input() fields: FormScheme = defaultForgotPasswordFormFields;
    @Input() conditions: Condition[] = [];

    submittedValue: any;
    async send() {
        this.loading.set(true);

        try {
            this.submittedValue = this.model();
            const res = await this.auth.forgotPassword(this.submittedValue.email, this.submittedValue);
            this.success.emit(res);
        } catch (error) {
            const err = this.handleError(error);
            console.error(err);
            this.fail.emit(err);
        } finally {
            this.loading.set(false);
        }
    }

    onValueChange(e: ExtendedValueChangeEvent<{ email: string }>) {
        const value = e.value;
        console.log("value changed", value, this.submittedValue);

        if (!this.#timeoutHandler) return this.enableSubmit();

        const email = value.email.trim().toLocaleLowerCase();
        const submittedEmail = (this.submittedValue?.email ?? "").trim().toLocaleLowerCase();
        console.log(email === submittedEmail, email, submittedEmail);

        if (email === submittedEmail) return;

        this.submittedValue = null;
        clearTimeout(this.#timeoutHandler);
        this.enableSubmit();
    }
    enableSubmit() {
        this.submitBtn = { ...this.submitBtn, disabled: false };
    }
    disableSubmit() {
        this.submitBtn = { ...this.submitBtn, disabled: true };
    }
    #timeoutHandler: any;
    handleError(e) {
        let err = e.error ?? e;
        if (err.statusCode === 400) {
            if (e.message === "MISSING_EMAIL") err = { message: "Username or Email should be provided", code: 400 };
            else if (e.message === "INVALID_USER") err = { message: "User Can not perform this action", code: 400 };
            else if (e.message === "ALREADY_SENT") {
                err = { message: "Reset password link already sent", code: 400 };
                this.disableSubmit();
                this.#timeoutHandler = setTimeout(() => this.enableSubmit(), 60000);
            }
        }
        return err;
    }
}

//http://localhost:4200/en/resetpassword?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoicmVzZXQiLCJpYXQiOjE1ODMyNDI0MTUsImV4cCI6MTU4MzI0MzAxNSwiaXNzIjoiU1MiLCJzdWIiOiJhZG1pbiJ9.101CO7h8efci98hEORxr5eLwZb5m36XdI7ddTvqe3qY
