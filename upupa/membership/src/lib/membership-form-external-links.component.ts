
import { Component, computed, input } from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
    selector: "external-links",
    styles: [
        `
            :host {
                display: flex;
                justify-content: space-between;
            }
        `,
    ],
    template: ` @for (link of links(); track $index) {
        <a i18n [routerLink]="link.routerLink" [queryParams]="link.queryParams">{{ link.text }}</a>
    }`,
    imports: [RouterLink]
})
export class MembershipFormExternalLinksComponent {
    links = input.required<({ text: string } & RouterLink)[]>();
}
