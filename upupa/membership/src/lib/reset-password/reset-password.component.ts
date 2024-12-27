import { Component, HostBinding, inject, signal } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { AuthService } from "@upupa/auth";

import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { LOG_IN_ON_SUCCESS_TOKEN, LOG_IN_OPTIONS } from "../di.token";
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
    @HostBinding("class") readonly class = "account-page-wrapper reset-password-page";
    readonly options: MembershipLoginOptions = inject(LOG_IN_OPTIONS);
    redirectPath: string;
    loading = false;
    reset_token = signal("");

    constructor(
        public readonly auth: AuthService,
        private readonly router: Router,
        private readonly route: ActivatedRoute,
    ) {
        this.route.queryParams.pipe(takeUntilDestroyed()).subscribe((qps) => {
            this.reset_token.set(qps["reset_token"]);
        });
    }

    private readonly onSuccessHandler = inject(LOG_IN_ON_SUCCESS_TOKEN, { optional: true });

    async onSuccess(value: any) {
        if (!this.auth.user)
            await this.router.navigate(["../login"], {
                queryParams: this.route.snapshot.queryParams,
                relativeTo: this.route,
            });
        else {
            this.onSuccessHandler?.();
        }
    }

    async onFailed(error: any) {
        const msg = typeof error === "string" ? error : error.message;
        if (msg === "NEW-PASSWORD_RESET-TOKEN_REQUIRED" || msg === "TOKEN_ALREADY_USED" || msg === "INVALID_TOKEN") {
            await this.router.navigate(["../login"], {
                queryParams: {
                    ...this.route.snapshot.queryParams,
                    reset_token: undefined,
                },
                relativeTo: this.route,
            });
        } else console.error(error);
    }
}
