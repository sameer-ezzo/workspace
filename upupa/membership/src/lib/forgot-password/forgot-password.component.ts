import { Component, inject, Injector } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
    selector: "forgot-password",
    templateUrl: "./forgot-password.component.html",
    styleUrls: ["./forgot-password.component.scss"],
    imports: [CommonModule]
})
export class ForgotPasswordComponent {
    // readonly options: MembershipForgotPasswordOptions = inject(FORGOT_PASSWORD_OPTIONS);

    private readonly injector = inject(Injector);
    onSuccess(value: any) {
        // if (this.options.on_success) {
        //     runInInjectionContext(this.injector, () => this.options.on_success(this, value));
        // }
    }

    onFailed(e: any) {
        // if (this.options.on_error) {
        //     runInInjectionContext(this.injector, () => this.options.on_error(this, e));
        // }
    }
}
