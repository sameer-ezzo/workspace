import { AfterViewInit, Component, HostBinding, OnInit, inject, model } from '@angular/core';
import {
    IdPs_OPTIONS,
    LOG_IN_EXTERNAL_LINKS_TOKEN, LOG_IN_INITIAL_VALUE_FACTORY_TOKEN,
    LOG_IN_LINKS_TOKEN, LOG_IN_ON_FAILED_TOKEN,
    LOG_IN_ON_SUCCESS_TOKEN, LOG_IN_OPTIONS
} from '../di.token';
import { IdpName, MembershipLoginOptions } from '../types';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '@upupa/auth';
@Component({
    selector: 'login',
    styleUrls: ['./login.component.scss'],
    templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit, AfterViewInit {

    @HostBinding('class') readonly class = 'account-page-wrapper login-page';
    readonly options: MembershipLoginOptions = inject(LOG_IN_OPTIONS);
    readonly idps_options: Record<string, any> = inject(IdPs_OPTIONS);

    private readonly router = inject(Router)
    private readonly route = inject(ActivatedRoute)

    private readonly onSuccessHandler = inject(LOG_IN_ON_SUCCESS_TOKEN, { optional: true });
    private readonly onFailedHandler = inject(LOG_IN_ON_FAILED_TOKEN, { optional: true }) ?? (() => { })
    readonly initialValueFactory = inject(LOG_IN_INITIAL_VALUE_FACTORY_TOKEN, { optional: true }) ?? (() => (
        { email: '', password: "", rememberMe: false }
    ));
    value = model(this.initialValueFactory() as any)
    readonly links = inject(LOG_IN_LINKS_TOKEN) ?? [];
    external_links = inject(LOG_IN_EXTERNAL_LINKS_TOKEN) ?? [];



    private readonly auth = inject(AuthService)


    idps: { text: string, idpName?: IdpName, clientId: string }[] = null

    ngOnInit(): void {
        this.idps = Object.entries(this.idps_options ?? {}).map(([key, value]) => {
            return { text: key, ...value }
        })

        this.external_links = this.external_links.concat(this.idps.map((idp) => {
            return {
                ...idp,
                label: `Login with ${idp.text}`,
                idpName: idp.text as IdpName
            } as any
        }))

    }
    ngAfterViewInit(): void {
    }

    onExternalLinkClick(link: { clientId: string }) {
    }

    onSuccess(value: any) {
        this.onSuccessHandler?.()
    }

    onFailed(value: any) {
        this.onFailedHandler?.()
    }


    async onResetPassword(payload: { reset_token: string }) {
        await this.router.navigate(['../reset-password'], {
            queryParams: { ...this.route.snapshot.queryParams, reset_token: payload.reset_token }
            , relativeTo: this.route
        })
    }

}