import { Component, input } from "@angular/core";
import { MarkdownPipe } from "@upupa/common";
import { formInput } from "@upupa/dynamic-form";
import { WidgetBlueprint } from "../model";

class MarkdownWidgetSettings {
    @formInput({ input: "textarea" })
    text = "";
}

@Component({
    selector: "md-widget",
    standalone: true,
    imports: [MarkdownPipe],
    template: ` <div [innerHTML]="text() | markdown"></div> `,
})
export class MarkdownWidget {
    text = input<string>();
}

export const MARKDOWN_WIDGET_BLUEPRINT: WidgetBlueprint<MarkdownWidget> = {
    id: "md-widget",
    title: "Markdown",
    icon: "code",
    w: 3,
    description: "Shows markdown paragraph",
    template: { component: MarkdownWidget, inputs: { text: `
### Heading
Lorem ipsum dolor sit amet, consectetur adipiscing elit.
        ` } },
    settingsForm: MarkdownWidgetSettings,
};
