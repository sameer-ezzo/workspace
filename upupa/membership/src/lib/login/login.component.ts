import { AfterViewInit, Component, Injector, SimpleChanges, computed, inject, input, model, output, runInInjectionContext } from "@angular/core";

import { AuthService, IdPName } from "@upupa/auth";
import { CommonModule } from "@angular/common";
import { LoginFormComponent } from "../login-form/login-form.component";
import { MatButtonModule } from "@angular/material/button";
import { FormScheme } from "@upupa/dynamic-form";
import { defaultLoginFormFields } from "../default-values";
import { FormHandler, loginErrorHandler, loginSuccessHandler } from "../types";
import { GoogleIdProviderButton } from "../idps-buttons/google-login-button.component";
import { DynamicComponent } from "@upupa/common";

@Component({
    selector: "login",
    styleUrls: ["./login.component.scss"],
    templateUrl: "./login.component.html",
    imports: [LoginFormComponent, MatButtonModule, CommonModule, GoogleIdProviderButton],
    host: { class: "login-page" },
})
export class LoginComponent implements AfterViewInit {
    readonly auth = inject(AuthService);

    fields = input<FormScheme>(defaultLoginFormFields);
    providers = input<IdPName[], IdPName[]>(this.auth.IdProviders, { transform: (providers) => providers ?? ["email-and-password"] });
    externalLinks = input<DynamicComponent>(null);
    login_success = output<{ value: any; provider: IdPName }>();
    login_error = output<{ error: any; provider: IdPName }>();

    emailAndPasswordProvider = computed(() => this.providers().find((p) => p === "email-and-password"));
    idps = computed(() =>
        this.providers()
            .filter((p) => p !== "email-and-password")
            .map((idp) => {
                const provider = this.auth.getProviderByName(idp);
                return { name: idp, provider: provider, options: provider.options };
            }),
    );
    ngOnChanges(changes: SimpleChanges) {
        console.log("Changes detected in LoginComponent:", changes);
    }
    value = model<any>();
    injector = inject(Injector);

    ngAfterViewInit(): void {}

    idpLogin(idp: IdPName) {
        try {
            const e = this.auth.signinWithProvider(idp);
            this.onSuccess({ value: e, provider: idp });
        } catch (e) {
            this.onFailed({ error: e, provider: idp });
        }
    }

    onSuccess(value: any, provider?: IdPName) {
        runInInjectionContext(this.injector, () => this.login_success.emit({ value, provider: provider ?? "email-and-password" }));
    }

    onFailed(error: any, provider?: IdPName) {
        runInInjectionContext(this.injector, () => this.login_error.emit({ error, provider: provider ?? "email-and-password" }));
    }
}
