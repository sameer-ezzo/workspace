import { Component, input } from "@angular/core";
import { HtmlPipeStandalone } from "@upupa/common";
import { formInput } from "@upupa/dynamic-form";
import { WidgetBlueprint } from "../model";

class HtmlWidgetSettings {
    @formInput({ input: "html" })
    text = "";
}

@Component({
    selector: "html-widget",
    imports: [HtmlPipeStandalone],
    template: ` <div [innerHTML]="text() | html"></div> `
})
export class HtmlWidget {
    text = input<string>();
}

export const HTML_WIDGET_BLUEPRINT: WidgetBlueprint<HtmlWidget> = {
    id: "html-widget",
    title: "HTML",
    icon: "code",
    w: 3,
    description: "Shows HTML paragraph",
    template: { component: HtmlWidget, inputs: { text: "<p>Lorem ipsum <b>dolor sit amet</b>, consectetur adipisicing elit.</p>" } },
    settingsForm: HtmlWidgetSettings,
};
