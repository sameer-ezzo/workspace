import { AfterViewInit, Component, Injector, computed, inject, input, model, runInInjectionContext } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";

import { AuthService, IdPName } from "@upupa/auth";
import { CommonModule } from "@angular/common";
import { LoginFormComponent } from "../login-form/login-form.component";
import { MatButtonModule } from "@angular/material/button";
import { FormScheme } from "@upupa/dynamic-form";
import { defaultLoginFormFields } from "../default-values";
import { loginErrorHandler, loginSuccessHandler } from "../types";
import { GoogleIdProviderButton } from "../idps-buttons/google-login-button.component";

@Component({
    selector: "login",
    styleUrls: ["./login.component.scss"],
    templateUrl: "./login.component.html",
    imports: [LoginFormComponent, MatButtonModule, CommonModule, GoogleIdProviderButton],
    host: { class: "login-page" }
})
export class LoginComponent implements AfterViewInit {
    readonly auth = inject(AuthService);

    fields = input<FormScheme>(defaultLoginFormFields);
    providers = input<IdPName[]>(this.auth.IdProviders);
    on_success = input<(self: LoginComponent, value: any) => void>(loginSuccessHandler);
    on_error = input<(self: LoginComponent, value: any) => void>(loginErrorHandler);

    emailAndPasswordProvider = computed(() => this.providers().find((p) => p === "email-and-password"));
    idps = computed(() =>
        this.providers()
            .filter((p) => p !== "email-and-password")
            .map((idp) => {
                const provider = this.auth.getProviderByName(idp);
                return { name: idp, provider: provider, options: provider.options };
            }),
    );

    value = model<any>();
    injector = inject(Injector);

    ngAfterViewInit(): void {}

    idpLogin(idp: IdPName) {
        try {
            const e = this.auth.signinWithProvider(idp);
            this.onSuccess(e);
        } catch (e) {
            this.onFailed(e);
        }
    }

    async onSuccess(value: any) {
        const cb = this.on_success();
        if (cb && typeof cb === "function") {
            runInInjectionContext(this.injector, () => cb(this, value));
        }
    }

    onFailed(error: any) {
        const cb = this.on_error();
        if (cb && typeof cb === "function") {
            runInInjectionContext(this.injector, () => cb(this, error));
        }
    }
}
