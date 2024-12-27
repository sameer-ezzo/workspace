import { Component, inject, HostBinding } from "@angular/core";
import { MembershipSignupOptions } from "../types";
import { SIGNUP_OPTIONS, SIGNUP_ON_SUCCESS_TOKEN, SIGNUP_ON_FAILED_TOKEN, SIGNUP_INITIAL_VALUE_FACTORY_TOKEN, SIGNUP_LINKS_TOKEN, SIGNUP_EXTERNAL_LINKS_TOKEN } from "../di.token";
import { PageNavigationComponent } from "../page-navigation/page-navigation.component";
import { SignUpFormComponent } from "../signup-form/signup-form.component";

@Component({
    standalone: true,
    selector: "signup",
    styleUrls: ["./signup.component.scss"],
    templateUrl: "./signup.component.html",
    imports: [PageNavigationComponent, SignUpFormComponent],
})
export class SignUpComponent {
    @HostBinding("class") readonly class = "account-page-wrapper signup-page";
    readonly options: MembershipSignupOptions = inject(SIGNUP_OPTIONS);

    private readonly onSuccessHandler = inject(SIGNUP_ON_SUCCESS_TOKEN, { optional: true });
    private readonly onFailedHandler = inject(SIGNUP_ON_FAILED_TOKEN, { optional: true }) ?? (() => {});
    readonly initialValueFactory = inject(SIGNUP_INITIAL_VALUE_FACTORY_TOKEN, { optional: true }) ?? (() => ({}));
    model = this.initialValueFactory() as any;
    readonly links = inject(SIGNUP_LINKS_TOKEN, { optional: true });
    readonly external_links = inject(SIGNUP_EXTERNAL_LINKS_TOKEN, { optional: true });

    onSuccess(value: any) {
        this.onSuccessHandler?.();
    }

    onFailed(value: any) {
        this.onFailedHandler?.();
    }
}
