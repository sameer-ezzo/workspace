import { isPlatformBrowser } from "@angular/common";
import { Component, computed, effect, inject, input, PLATFORM_ID } from "@angular/core";
import { RouterOutlet } from "@angular/router";

/**
 * @description Value is of this type is passed directly to the CSS content property. Therefore, to display a static text, it should be wrapped in quotes. Also, content functions can be used.
 * @example "Page "counter(pageNumber) "of" counter(pages)
 */
export type CssContent = string;

@Component({
    selector: "print-layout",
    imports: [RouterOutlet],
    template: `<router-outlet></router-outlet>`,
    styles: `
        ::ng-deep {
            @media print {
                * {
                    transition: none !important;
                    -webkit-transition: none !important;
                    animation: none !important;
                    -webkit-animation: none !important;
                }
                button {
                    display: none;
                }
            }
        }
    `,
})
export class PrintLayoutComponent {
    isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

    size = input("A4 portrait");

    topLeftCorner = input<CssContent>("");
    topLeft = input<CssContent>("");
    topCenter = input<CssContent>("");
    topRight = input<CssContent>("");
    topRightCorner = input<CssContent>("");

    bottomLeftCorner = input<CssContent>("");
    bottomLeft = input<CssContent>("");
    bottomCenter = input<CssContent>("");
    bottomRight = input<CssContent>("");
    bottomRightCorner = input<CssContent>("");

    leftTop = input<CssContent>("");
    leftMiddle = input<CssContent>("");
    leftBottom = input<CssContent>("");
    rightTop = input<CssContent>("");
    rightMiddle = input<CssContent>("");
    rightBottom = input<CssContent>("");

    openPrint = input(true);

    styleElement = computed(() => {
        const style = document.createElement("style");
        style.id = "print-layout-style";
        style.innerHTML = `
            @page {
                size: ${this.size() ?? "A4"};
                @top-left-corner { content: ${this.topLeftCorner() ?? ""}; }
                @top-left { content: ${this.topLeft() ?? ""}; }
                @top-center { content: ${this.topCenter() ?? ""}; }
                @top-right { content: ${this.topRight() ?? ""}; }
                @top-right-corner { content: ${this.topRightCorner() ?? ""}" };

                @bottom-left-corner { content: ${this.bottomLeftCorner() ?? ""}; }
                @bottom-left { content: ${this.bottomLeft() ?? ""}; }
                @bottom-center { content: ${this.bottomCenter() ?? ""}; }
                @bottom-right { content: ${this.bottomRight() ?? ""}; }
                @bottom-right-corner { content: ${this.bottomRightCorner() ?? ""}" };

                @left-top { content: ${this.leftTop() ?? ""}; }
                @left-middle { content: ${this.leftMiddle() ?? ""}; }
                @left-bottom { content: ${this.leftBottom() ?? ""}; }

                @right-top { content: ${this.rightTop() ?? ""}; }
                @right-middle { content: ${this.rightMiddle() ?? ""}; }
                @right-bottom { content: ${this.rightBottom() ?? ""}; }
            }
        `;
        return style;
    });

    constructor() {
        if (!this.isBrowser) return;
        effect(() => {
            const style = this.styleElement();
            document.getElementById("print-layout-style")?.remove();
            document.head.appendChild(style);
        });
    }

    ngAfterViewInit() {
        if (this.isBrowser && this.openPrint()) {
            window.print();
        }
    }
}
