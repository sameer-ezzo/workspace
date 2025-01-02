import { Component, HostBinding, inject } from "@angular/core";
import {
    FORGOT_PASSWORD_EXTERNAL_LINKS_TOKEN,
    FORGOT_PASSWORD_INITIAL_VALUE_FACTORY_TOKEN,
    FORGOT_PASSWORD_LINKS_TOKEN,
    FORGOT_PASSWORD_ON_FAILED_TOKEN,
    FORGOT_PASSWORD_ON_SUCCESS_TOKEN,
    FORGOT_PASSWORD_OPTIONS,
} from "../di.token";
import { MembershipForgotPasswordOptions } from "../types";
import { PageNavigationComponent } from "../page-navigation/page-navigation.component";
import { ForgotPasswordFormComponent } from "../forgot-password-form/forgot-password-form.component";

@Component({
    standalone: true,
    selector: "forgot-password",
    templateUrl: "./forgot-password.component.html",
    styleUrls: ["./forgot-password.component.scss"],
    imports: [PageNavigationComponent, ForgotPasswordFormComponent],
})
export class ForgotPasswordComponent {
    @HostBinding("class") readonly class = "account-page-wrapper forgotpassword-page";

    readonly options: MembershipForgotPasswordOptions = inject(FORGOT_PASSWORD_OPTIONS);

    private readonly onSuccessHandler = inject(FORGOT_PASSWORD_ON_SUCCESS_TOKEN, { optional: true });
    private readonly onFailedHandler = inject(FORGOT_PASSWORD_ON_FAILED_TOKEN, { optional: true }) ?? (() => {});
    readonly initialValueFactory = inject(FORGOT_PASSWORD_INITIAL_VALUE_FACTORY_TOKEN) ?? (() => ({}));
    model = this.initialValueFactory() as { email: string; token?: string };
    readonly links = inject(FORGOT_PASSWORD_LINKS_TOKEN);
    readonly external_links = inject(FORGOT_PASSWORD_EXTERNAL_LINKS_TOKEN);

    onSuccess(value: any) {
        this.onSuccessHandler?.();
    }

    onFailed(value: any) {
        this.onFailedHandler?.();
    }
}
