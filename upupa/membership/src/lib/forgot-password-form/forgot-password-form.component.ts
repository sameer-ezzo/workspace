import { Component, Input, Output, EventEmitter, inject, ViewChild, signal } from "@angular/core";
import { AuthService } from "@upupa/auth";
import { ActionDescriptor } from "@upupa/common";
import { CollectorComponent, FormScheme } from "@upupa/dynamic-form";
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
    @ViewChild("loginForm") loginForm: CollectorComponent;
    private readonly auth = inject(AuthService);
    loading = signal(false);
    error: string;
    @Output() success = new EventEmitter();
    @Output() fail = new EventEmitter();

    @Input() model: { email: string; phone?: string } & Record<string, unknown> = { email: "" };
    @Input() submitBtn: ActionDescriptor = { name: "submit", type: "submit", text: "Submit", color: "primary", variant: "raised" };
    @Input() fields: FormScheme = defaultForgotPasswordFormFields;
    @Input() conditions: Condition[] = [];

    async send() {
        this.loading.set(true);

        try {
            await this.auth.forgotPassword(this.model.email, this.model);
            this.success.emit();
        } catch (error) {
            this.fail.emit();
        } finally {
            this.loading.set(false);
        }
    }
}

//http://localhost:4200/en/resetpassword?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoicmVzZXQiLCJpYXQiOjE1ODMyNDI0MTUsImV4cCI6MTU4MzI0MzAxNSwiaXNzIjoiU1MiLCJzdWIiOiJhZG1pbiJ9.101CO7h8efci98hEORxr5eLwZb5m36XdI7ddTvqe3qY
