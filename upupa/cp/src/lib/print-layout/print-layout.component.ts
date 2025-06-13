import { DOCUMENT, isPlatformBrowser } from "@angular/common";
import { Component, computed, effect, inject, input, PLATFORM_ID } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { delay } from "@noah-ark/common";
import { printElement } from "@upupa/common";

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

                body {
                    background: transparent !important;
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

    printStyles = computed(() => {
        return `
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
    });

    styleElement = computed(() => {
        const style = document.createElement("style");
        style.id = "print-layout-style";
        style.innerHTML = this.printStyles();
        style.type = "text/css";
        style.media = "print";

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

    async ngAfterViewInit() {
        if (this.isBrowser && this.openPrint()) {
            // alert("This is a print layout. Please use the browser's print functionality to print this page.");
            // window.print();
            // await delay(1000); // wait for the styles to be applied
            // await printElement(this.doc, this.doc.body, {
            //     customCSS: this.printStyles(),
            //     copyStyles: false,
            //     waitForImages: true,
            // });
        }
    }
}
