import { AfterViewInit, Component, Directive, ElementRef, Injector, OnInit, SimpleChanges, computed, inject, input, model, output, runInInjectionContext } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";

import { AuthService, IdPName, IdProviderService } from "@upupa/auth";
import { CommonModule } from "@angular/common";
import { LoginFormComponent } from "../login-form/login-form.component";
import { MatButtonModule } from "@angular/material/button";
import { FormScheme } from "@upupa/dynamic-form";
import { defaultLoginFormFields } from "../default-values";

@Component({
    standalone: true,
    selector: "google-id-provider",
    template: ` @if (!this.idp().canRender) {
        <button (click)="auth.signinWithProvider(idp().IdpName)" class="{{ idp().IdpName }}">
            <svg viewBox="-3 0 262 262" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid" fill="#000000">
                <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                <g id="SVGRepo_iconCarrier">
                    <path
                        d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
                        fill="#4285F4"
                    ></path>
                    <path
                        d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
                        fill="#34A853"
                    ></path>
                    <path
                        d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782"
                        fill="#FBBC05"
                    ></path>
                    <path
                        d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
                        fill="#EB4335"
                    ></path>
                </g>
            </svg>
            <span>Continue with Google</span>
        </button>
    }`,
})
export class GoogleIdProviderButton {
    idp = input.required<IdProviderService<any>>();
    success = output<any>();
    error = output<any>();

    readonly auth = inject(AuthService);
    private readonly el = inject(ElementRef);

    ngOnChanges(changes: SimpleChanges) {
        if (changes["idp"] && this.idp()) {
            if (this.idp().canRender) {
                this.idp().render?.(this.el.nativeElement, async (e) => {
                    if (!e.credential) {
                        this.error.emit(e);
                        return;
                    }
                    const value = await this.auth.signin_Google({ token: e.credential });
                    this.success.emit(value);
                });
            }
        }
    }
}

@Component({
    standalone: true,
    selector: "login",
    styleUrls: ["./login.component.scss"],
    templateUrl: "./login.component.html",
    imports: [LoginFormComponent, GoogleIdProviderButton, MatButtonModule, CommonModule],
    host: { class: "login-page" },
})
export class LoginComponent implements AfterViewInit {
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    readonly auth = inject(AuthService);

    fields = input<FormScheme>(defaultLoginFormFields);
    providers = input<IdPName[]>(this.auth.IdProviders);
    on_success = input<(self: LoginComponent, value: any) => void>();
    on_error = input<(self: LoginComponent, value: any) => void>();

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
