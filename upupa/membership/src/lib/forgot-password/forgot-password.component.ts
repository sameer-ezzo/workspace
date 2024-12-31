import { Component, inject } from "@angular/core";
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

    private readonly onSuccessHandler = inject(FORGOT_PASSWORD_ON_SUCCESS_TOKEN, { optional: true });
    private readonly onFailedHandler = inject(FORGOT_PASSWORD_ON_FAILED_TOKEN, { optional: true }) ?? (() => {});

    onSuccess(value: any) {
        this.onSuccessHandler?.();
    }

    onFailed(value: any) {
        this.onFailedHandler?.();
    }
}
