import { AfterViewInit, Component, Injector, OnInit, inject, input, model, runInInjectionContext } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";

import { AUTH_IDPs, AuthService } from "@upupa/auth";
import { CommonModule } from "@angular/common";
import { LoginFormComponent } from "../login-form/login-form.component";
import { IdpButtonDirective } from "../idp-button.directive";
import { PortalComponent } from "@upupa/common";

@Component({
    standalone: true,
    selector: "login",
    styleUrls: ["./login.component.scss"],
    templateUrl: "./login.component.html",
    imports: [LoginFormComponent, IdpButtonDirective, CommonModule, PortalComponent],
    host: { class: "account-page-wrapper login-page" },
})
export class LoginComponent implements OnInit, AfterViewInit {
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly auth = inject(AuthService);
    private readonly _idps = inject(AUTH_IDPs, { optional: true }) ?? [];

    on_success = input<(self: LoginComponent, value: any) => void>();
    form = this._idps.find((idp) => idp.name === "email-and-password");
    idps = this._idps.filter((idp) => idp.name !== "email-and-password");
    value = model<any>();
    injector = inject(Injector);

    ngOnInit(): void {
        console.log("idps", this.idps);

        // this.idps = Object.entries(this.idps_options ?? {}).map(([key, value]) => {
        //     return { text: key, ...value };
        // });
        // this.external_links = this.external_links.concat(
        //     this.idps.map((idp) => {
        //         return {
        //             ...idp,
        //             label: `Login with ${idp.text}`,
        //             idpName: idp.text as IdpName,
        //         } as any;
        //     }),
        // );
    }
    ngAfterViewInit(): void {}

    idpLoginSuccess(idp, e) {
        const cb = this.on_success();
        if (cb && typeof cb === "function") {
            runInInjectionContext(this.injector, () => cb(this, { idp, e }));
        }
    }

    async onSuccess(value: any) {
        // const onSuccessHandler = await this.onSuccessHandler;
        // if (typeof onSuccessHandler === "function") onSuccessHandler();
    }

    onFailed(value: any) {
        // this.onFailedHandler?.();
    }

    async onResetPassword(payload: { reset_token: string }) {
        // await this.router.navigate(["../reset-password"], {
        //     queryParams: { ...this.route.snapshot.queryParams, reset_token: payload.reset_token },
        //     relativeTo: this.route,
        // });
    }
}
