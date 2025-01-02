import { Component, computed, input } from "@angular/core";
import { formInput } from "@upupa/dynamic-form";
import { WidgetBlueprint } from "../model";

class ImageWidgetSettings {
    @formInput({ input: "text" })
    src = "";
}

@Component({
    selector: "img-widget",
    standalone: true,
    template: ` <img [src]="src()" [class]="cssClass()" /> `,
})
export class ImageWidget {
    src = input<string>();
    cssClass = input<string>();
}

export const IMAGE_WIDGET_BLUEPRINT: WidgetBlueprint<ImageWidget> = {
    id: "img-widget",
    title: "Image",
    icon: "image",
    w: 3,
    description: "Shows image based on URL",
    template: { component: ImageWidget, inputs: { src: "", cssClass: "" } },
    settingsForm: ImageWidgetSettings,
};
