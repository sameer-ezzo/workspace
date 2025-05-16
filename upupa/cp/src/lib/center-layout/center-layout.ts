import { Component, input, ViewEncapsulation } from "@angular/core";
import { RouterOutlet } from "@angular/router";

@Component({
    selector: "center-layout",
    imports: [RouterOutlet],
    encapsulation: ViewEncapsulation.None,
    styles: `
        center-layout {
            height: 100vh;
            display: flex;
            // align-items: center;
            justify-content: center;
            padding: 1rem;
            max-width: 500px;
            // width:100%;
            margin: auto;
            flex-direction:column;
        }

        center-layout > * {
            flex: 0 0 1;
        }
        .logo-holder {
            display: flex;
            justify-content: center;
            margin-bottom: 3rem;

        }
    `,
    template: `

@if(logo()){

    <div class="logo-holder">
        <img src="/assets/logo.png"  alt="">
    </div>
}

     <router-outlet style="display: none"></router-outlet> `,
})
export class CenterLayoutComponent {
    logo = input<string|undefined>()
}
