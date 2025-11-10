import { Component, inject, Injector, input, output, runInInjectionContext, signal } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { AuthService } from "@upupa/auth";
import { ResetPasswordFormComponent } from "../reset-password-form/reset-password-form.component";

@Component({
    selector: "reset-password",
    templateUrl: "./reset-password.component.html",
    styleUrls: ["./reset-password.component.scss"],
    imports: [ResetPasswordFormComponent],
})
export class ResetPasswordComponent {
    public readonly auth: AuthService = inject(AuthService);

    on_success = output<{ value: any }>();
    on_error = output<any>();
    loading = signal(false);
    reset_token = input("");
    private readonly injector = inject(Injector);
    async onSuccess(value: any) {
        runInInjectionContext(this.injector, () => this.on_success.emit({ value }));
    }

    async onFailed(error: any) {
        runInInjectionContext(this.injector, () => this.on_error.emit(error));
    }
}
