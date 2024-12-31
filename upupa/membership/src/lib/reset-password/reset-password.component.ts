import { Component, inject, Injector, input, runInInjectionContext, signal } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { AuthService } from "@upupa/auth";

import { RESET_PASSWORD_OPTIONS } from "../di.token";
import { MembershipLoginOptions } from "../types";
import { ResetPasswordFormComponent } from "../reset-password-form/reset-password-form.component";

@Component({
    standalone: true,
    selector: "reset-password",
    templateUrl: "./reset-password.component.html",
    styleUrls: ["./reset-password.component.scss"],
    imports: [ResetPasswordFormComponent],
})
export class ResetPasswordComponent {
    readonly options: MembershipLoginOptions = inject(RESET_PASSWORD_OPTIONS);
    public readonly auth: AuthService = inject(AuthService);
    private readonly router: Router = inject(Router);
    private readonly route: ActivatedRoute = inject(ActivatedRoute);

    private readonly injector = inject(Injector);

    loading = signal(false);
    reset_token = input("");

    async onSuccess(value: any) {
        if (this.options.on_success) {
            runInInjectionContext(this.injector, () => this.options.on_success(this));
        }
        // if (!this.auth.user)
        //     await this.router.navigate(["../login"], {
        //         queryParams: this.route.snapshot.queryParams,
        //         relativeTo: this.route,
        //     });
        // else {
        //     this.onSuccessHandler?.();
        // }
    }

    async onFailed(error: any) {
        if (this.options.on_error) {
            runInInjectionContext(this.injector, () => this.options.on_error(this, error));
        }
        // const msg = typeof error === "string" ? error : error.message;
        // if (msg === "NEW-PASSWORD_RESET-TOKEN_REQUIRED" || msg === "TOKEN_ALREADY_USED" || msg === "INVALID_TOKEN") {
        //     await this.router.navigate(["../login"], {
        //         queryParams: {
        //             ...this.route.snapshot.queryParams,
        //             reset_token: undefined,
        //         },
        //         relativeTo: this.route,
        //     });
        // } else console.error(error);
    }
}
