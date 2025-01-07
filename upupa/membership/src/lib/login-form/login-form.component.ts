import { Component, inject, signal, output, viewChild, model, input, computed } from "@angular/core";
import { AuthService, Credentials } from "@upupa/auth";
import { CollectorComponent, FormScheme } from "@upupa/dynamic-form";
import { ActionDescriptor, DynamicComponent, PortalComponent } from "@upupa/common";
import { Condition } from "@noah-ark/expression-engine";

import { FormControl } from "@angular/forms";
import { Principle } from "@noah-ark/common";
import { CommonModule } from "@angular/common";
import { MembershipFormExternalLinksComponent } from "../membership-form-external-links.component";
import { defaultLoginFormFields } from "../default-values";

@Component({
    standalone: true,
    selector: "login-form",
    styleUrls: ["./login-form.component.scss"],
    templateUrl: "./login-form.component.html",
    imports: [CollectorComponent, CommonModule, PortalComponent]
})
export class LoginFormComponent {
    loginForm = viewChild<CollectorComponent>("loginForm");
    private readonly auth = inject(AuthService);
    loading = signal(false);
    error: string;
    control = new FormControl();

    success = output<Principle | { type: "reset-pwd"; reset_token: string }>();
    resetPassword = output<{ reset_token: string }>();
    fail = output<any>();

    value = model<{ email: string; password: string; rememberMe?: boolean }>();
    submitBtn = input<ActionDescriptor>({
        name: "login",
        type: "submit",
        text: "login",
        color: "primary",
        variant: "raised",
    });
    // https://www.chromium.org/developers/design-documents/form-styles-that-chromium-understands/
    // https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofilling-form-controls%3A-the-autocomplete-attribute
    fields = input<FormScheme, FormScheme>(
        {},
        {
            transform: (fields) => {
                if(!fields) fields = defaultLoginFormFields;
                if (fields["email"]) fields["email"].inputs["autocomplete"] = "username";
                if (fields["username"]) fields["username"].inputs["autocomplete"] = "username";
                if (fields["password"]) fields["password"].inputs["autocomplete"] = "current-password";

                return fields;
            },
        },
    );
    conditions = input<Condition[]>([]);

    externalLinks = input<DynamicComponent>({
        component: MembershipFormExternalLinksComponent,
        inputs: {
            links: [
                { text: "Forgot password?", routerLink: ["../forgot-password"] },
                { text: "Sign up", routerLink: ["../signup"] },
            ],
        },
    });

    stage = signal<"check-user" | "fill-password">("check-user");
    formFields = computed(() => {
        const fields = this.fields();
        const stage = this.stage();
        if (stage === "check-user") {
            return {
                email: fields["email"],
            };
        } else {
            return {
                ...fields,
            };
        }
    });
    async signin() {
        this.error = null;
        this.loading.set(true);

        const stage = this.stage();
        if (stage === "check-user") {
            const value = this.value();
            const res = await this.auth.checkUser(value.email);
            console.log(res);

            if (!res.canLogin) throw new Error("INVALID_ATTEMPT");
            this.stage.set("fill-password");
            return;
        }

        try {
            const res = await this.auth.signin(this.value() as Credentials);
            if (res?.type === "reset-pwd") {
                //todo: add handeler for reset password in login options
                const { reset_token } = res;
                this.resetPassword.emit({ reset_token: reset_token as string });
            } else this.success.emit(res);
        } catch (error) {
            const err = error?.msg ?? error?.message ?? error;
            if (err === "INVALID_ATTEMPT") this.error = "username-password-wrong";
            else if (err === "TOO_MANY_LOGIN_ATTEMPTS") this.error = "too-many-attempts";
            else if (err === "CONNECTION_ERROR") this.error = "connection-error";
            else this.error = error;
            console.error("login", error);
            this.fail.emit(this.error);
        } finally {
            this.loading.set(false);
        }
    }
}
