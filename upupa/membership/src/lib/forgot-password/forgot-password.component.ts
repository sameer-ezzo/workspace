import { Component, inject, Injector, runInInjectionContext } from "@angular/core";
import { FORGOT_PASSWORD_ON_FAILED_TOKEN, FORGOT_PASSWORD_ON_SUCCESS_TOKEN, FORGOT_PASSWORD_OPTIONS } from "../di.token";
import { MembershipForgotPasswordOptions } from "../types";
import { ForgotPasswordFormComponent } from "../forgot-password-form/forgot-password-form.component";
import { CommonModule } from "@angular/common";

@Component({
    standalone: true,
    selector: "forgot-password",
    templateUrl: "./forgot-password.component.html",
    styleUrls: ["./forgot-password.component.scss"],
    imports: [ForgotPasswordFormComponent, CommonModule],
})
export class ForgotPasswordComponent {
    readonly options: MembershipForgotPasswordOptions = inject(FORGOT_PASSWORD_OPTIONS);

    private readonly injector = inject(Injector);
    onSuccess(value: any) {
        if (this.options.on_success) {
            runInInjectionContext(this.injector, () => this.options.on_success(this, value));
        }
    }

    onFailed(e: any) {
        if (this.options.on_error) {
            runInInjectionContext(this.injector, () => this.options.on_error(this, e));
        }
    }
}
