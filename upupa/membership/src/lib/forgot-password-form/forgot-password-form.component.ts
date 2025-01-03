import { Component, inject, signal, model, output, viewChild, input } from "@angular/core";
import { AuthService } from "@upupa/auth";
import { ActionDescriptor, DynamicComponent, PortalComponent } from "@upupa/common";
import { CollectorComponent, FormScheme } from "@upupa/dynamic-form";
import { defaultForgotPasswordFormFields } from "../default-values";
import { Condition } from "@noah-ark/expression-engine";
import { FormControl } from "@angular/forms";
import { MembershipFormExternalLinksComponent } from "../membership-form-external-links.component";

@Component({
    standalone: true,
    selector: "forgot-password-form",
    templateUrl: "./forgot-password-form.component.html",
    styleUrls: ["./forgot-password-form.component.scss"],
    imports: [CollectorComponent, PortalComponent],
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
    submitBtn = input<ActionDescriptor>();
    fields = input<FormScheme>(defaultForgotPasswordFormFields);
    conditions = input<Condition[]>([]);
    externalLinks = input<DynamicComponent>({ component: MembershipFormExternalLinksComponent, inputs: { links: [{ text: "Login", routerLink: ["../login"] }] } });

    _submitBtn = signal<ActionDescriptor>({ name: "submit", type: "submit", text: "Submit", color: "primary", variant: "raised", disabled: true } as ActionDescriptor);

    async send() {
        this.loading.set(true);
        this.disableSubmit();
        try {
            const value = { ...this.model() };
            const res = await this.auth.forgotPassword(value.email, value);
            this.success.emit(res);
        } catch (error) {
            const err = this.handleError(error);
            console.error(err);
            this.fail.emit(err);
        } finally {
            this.loading.set(false);
            this.enableSubmit();
        }
    }

    enableSubmit() {
        this._submitBtn.set({ ...this._submitBtn(), disabled: false } as ActionDescriptor);
    }
    disableSubmit() {
        this._submitBtn.set({ ...this._submitBtn(), disabled: true } as ActionDescriptor);
    }

    handleError(e) {
        let err = e.error ?? e;
        if (err.statusCode === 400) {
            if (e.message === "MISSING_EMAIL") err = { message: "Username or Email should be provided", code: 400 };
            else if (e.message === "INVALID_USER") err = { message: "User Can not perform this action", code: 400 };
            else if (e.message === "ALREADY_SENT") err = { message: "Reset password link already sent", code: 400 };
        }
        return err;
    }
}

//http://localhost:4200/en/resetpassword?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoicmVzZXQiLCJpYXQiOjE1ODMyNDI0MTUsImV4cCI6MTU4MzI0MzAxNSwiaXNzIjoiU1MiLCJzdWIiOiJhZG1pbiJ9.101CO7h8efci98hEORxr5eLwZb5m36XdI7ddTvqe3qY
