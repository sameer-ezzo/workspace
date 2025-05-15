import { Component, ViewEncapsulation } from "@angular/core";
import { RouterOutlet } from "@angular/router";

@Component({
    selector: "center-layout",
    imports: [RouterOutlet],
    encapsulation: ViewEncapsulation.None,
    styles: `
        center-layout {
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            max-width: 500px;
            margin: auto;
        }

        center-layout > * {
            flex: 1 1 0;
        }
    `,
    template: ` <router-outlet style="display: none"></router-outlet> `
})
export class CenterLayoutComponent {}