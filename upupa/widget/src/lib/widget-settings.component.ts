import { Component, input, model, SimpleChanges, OnChanges, computed } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { Widget, WidgetBlueprint } from "./model";
import { DataFormComponent } from "@upupa/cp";
import { formInput } from "@upupa/dynamic-form";
import { FormsModule } from "@angular/forms";

export class WidgetSettingsForm {
    @formInput({ input: "text" })
    title = "";

    @formInput({ input: "text" })
    cssClass = "";

    @formInput({ input: "text" })
    x = 0;
    @formInput({ input: "text" })
    y = 0;
    @formInput({ input: "text" })
    w = 1;
    @formInput({ input: "text" })
    h = 1;

    constructor(self: Partial<WidgetSettingsForm> = {}) {
        this.x = self.x ?? 0;
        this.y = self.y ?? 0;
        this.w = self.w ?? 1;
        this.h = self.h ?? 1;
        this.title = self.title ?? "";
        this.cssClass = self.cssClass ?? "";
    }
}

@Component({
    selector: "widget-settings",
    standalone: true,
    imports: [MatButtonModule, MatIconModule, DataFormComponent, FormsModule],
    template: `
        <h1>Settings</h1>
        <data-form [viewModel]="settingsForm" [(value)]="settings"></data-form>
        <data-form [viewModel]="blueprint().settingsForm" [(value)]="inputs"></data-form>
    `,
})
export class WidgetSettingsComponent implements OnChanges {
    blueprints = input.required<WidgetBlueprint[]>();
    widget = input.required<Widget>();

    blueprint = computed<WidgetBlueprint>(() => {
        const widget = this.widget();
        return this.blueprints().find((w) => w.id === widget.template.selector);
    });

    settingsForm = WidgetSettingsForm;

    settings = model<WidgetSettingsForm>(new WidgetSettingsForm());
    inputs = model({});

    ngOnChanges(changes: SimpleChanges) {
        if (changes["widget"]) {
            const widget = this.widget();
            this.settings.set(new WidgetSettingsForm(widget));
            this.inputs.set(widget.template.inputs);
        }
    }
}
