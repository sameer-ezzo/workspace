import { Component, computed, input } from "@angular/core";
import { FileInfo } from "@noah-ark/common";
import { formInput } from "@upupa/dynamic-form";
import { WidgetBlueprint } from "../model";

class ImageWidgetSettings {
    @formInput({ input: "file" })
    src: FileInfo[] = [];
}

@Component({
    selector: "media-img-widget",

    template: ` <img [src]="img()" [class]="cssClass()" /> `,
})
export class MediaImageWidget {
    src = input<FileInfo[]>();
    cssClass = input<string>();

    img = computed<string>(() => {
        return this.src()[0]?.path;
    });
}

export const MEDIA_IMAGE_WIDGET_BLUEPRINT: WidgetBlueprint<MediaImageWidget> = {
    id: "media-img-widget",
    title: "Media Image",
    icon: "image",
    w: 3,
    description: "Shows media image",
    template: { component: MediaImageWidget, inputs: { src: [], cssClass: "" } },
    settingsForm: ImageWidgetSettings,
};
