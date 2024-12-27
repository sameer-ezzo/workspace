import { Component, input } from "@angular/core";
import { formInput } from "@upupa/dynamic-form";
import { WidgetBlueprint } from "../model";

class TextWidgetSettings {
    @formInput({ input: "textarea" })
    text = "";
}

@Component({
    selector: "text-widget",
    standalone: true,
    template: ` {{ text() }} `,
})
export class TextWidget {
    text = input<string>();
}

export const TEXT_WIDGET_BLUEPRINT: WidgetBlueprint<TextWidget> = {
    id: "text-widget",
    title: "Text",
    icon: "text_fields",
    w: 3,
    description: "Shows none-styled text paragraph",
    template: { component: TextWidget, inputs: { text: "Lorem ipsum dolor sit amet, consectetur adipisicing elit." } },
    settingsForm: TextWidgetSettings,
};
