
import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
    selector: "login-external-links",
    styles: [
        `
            :host {
                display: flex;
                justify-content: space-between;
            }
        `,
    ],
    template: ` <a i18n [routerLink]="['../forgot-password']">Forgot password?</a> <a i18n [routerLink]="['../signup']">Sign up</a> `,
    imports: [RouterLink]
})
export class LoginExternalLinksComponent {}
