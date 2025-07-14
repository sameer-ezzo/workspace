import { AfterViewInit, Component, Injector, SimpleChanges, computed, inject, input, model, output, runInInjectionContext } from "@angular/core";

import { AuthService, IdPName } from "@upupa/auth";

import { LoginFormComponent } from "../login-form/login-form.component";
import { MatButtonModule } from "@angular/material/button";
import { FormScheme } from "@upupa/dynamic-form";
import { defaultLoginFormFields } from "../default-values";

import { GoogleIdProviderButton } from "../idps-buttons/google-login-button.component";
import { DynamicComponent } from "@upupa/common";

const loginFormMatcher = (provider) => provider === "email-and-password" || provider === "username-and-password";
const loginFormProviders = (providers) => providers.filter(loginFormMatcher);

@Component({
    selector: "login",
    styleUrls: ["./login.component.scss"],
    templateUrl: "./login.component.html",
    imports: [LoginFormComponent, MatButtonModule, GoogleIdProviderButton],
    host: { class: "login-page" },
})
export class LoginComponent {
    readonly auth = inject(AuthService);
    injector = inject(Injector);

    value = model<any>();
    fields = input<FormScheme>(defaultLoginFormFields);
    providers = input<IdPName[], IdPName[]>(this.auth.IdProviders, { transform: (providers) => providers ?? [] });
    externalLinks = input<DynamicComponent>(null);
    on_success = output<{ value: any; provider: IdPName }>();
    on_error = output<{ error: any; provider: IdPName }>();

    emailAndPasswordProvider = computed(() => loginFormProviders(this.providers()));
    idps = computed(() =>
        this.providers()
            .filter((p) => !loginFormMatcher(p))
            .map((idp) => {
                const provider = this.auth.getProviderByName(idp);
                return { name: idp, provider: provider, options: provider.options };
            }),
    );

    idpLogin(idp: IdPName) {
        try {
            const e = this.auth.signinWithProvider(idp);
            this.onSuccess({ value: e, provider: idp });
        } catch (e) {
            this.onFailed({ error: e, provider: idp });
        }
    }

    onSuccess(value: any, provider?: IdPName) {
        runInInjectionContext(this.injector, () => this.on_success.emit({ value, provider: provider }));
    }

    onFailed(error: any, provider?: IdPName) {
        runInInjectionContext(this.injector, () => this.on_error.emit({ error, provider: provider }));
    }
}
