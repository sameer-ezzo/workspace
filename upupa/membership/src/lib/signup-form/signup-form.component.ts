import { Component, Output, inject, signal, input, model, output, viewChild } from "@angular/core";
import { AuthService } from "@upupa/auth";
import { ActionDescriptor, DynamicComponent, PortalComponent } from "@upupa/common";
import { CollectorComponent, FormScheme } from "@upupa/dynamic-form";
import { defaultSignupFormFields } from "../default-values";
import { Condition } from "@noah-ark/expression-engine";
import { FormControl } from "@angular/forms";
import { MembershipFormExternalLinksComponent } from "../membership-form-external-links.component";
import { JsonPipe } from "@angular/common";

@Component({
    selector: "signup-form",
    styleUrls: ["./signup-form.component.scss"],
    templateUrl: "./signup-form.component.html",
    imports: [CollectorComponent, PortalComponent, JsonPipe]
})
export class SignUpFormComponent {
    public readonly auth: AuthService = inject(AuthService);

    signupForm = viewChild<CollectorComponent>("signupForm");

    control = new FormControl();
    success = Output();
    fail = output();

    loading = signal<boolean>(false);
    value = model<any>();
    submitBtn = input<ActionDescriptor>({ name: "signup", type: "submit", text: "Signup", color: "primary", variant: "raised" });
    fields = input<FormScheme>(defaultSignupFormFields);

    conditions = input<Condition[]>([]);
    externalLinks = input<DynamicComponent>({ component: MembershipFormExternalLinksComponent, inputs: { links: [{ text: "Login", routerLink: ["../login"] }] } });

    async signup() {
        const collector = this.signupForm();
        if (collector.canGoNext()) {
            collector.next();
            return;
        }
        const value = collector.value() as any;
        try {
            this.loading.set(true);
            if (!value.username) value.username = value.email; //auto save email as username if not provided

            const user: any = { ...value };
            delete user.password;
            delete user.confirmPassword;

            const res = await this.auth.signup(user, value.password);
            const res2 = await this.auth.signin({ email: value.email, password: value.password });
            this.success.emit(res);
        } catch (error) {
            this.fail.emit(error);

            // if (error.status === 500) {
            //     const e = error.json ? error.json() : error.body;
            //     if (e.message && e.message.indexOf("duplicate key") > -1) {
            //         if (e.message.indexOf("index: email") > -1) this.snack.openFailed('duplicate-email');
            //         else if (e.message.indexOf("index: username") > -1) this.snack.openFailed('duplicate-username');
            //         else if (e.message.indexOf("index: phone") > -1) this.snack.openFailed('duplicate-phone');
            //         else this.snack.openFailed('not-saved');
            //     }
            // }
            // else this.snack.openFailed('not-saved');
        } finally {
            this.loading.set(false);
        }
    }
}
