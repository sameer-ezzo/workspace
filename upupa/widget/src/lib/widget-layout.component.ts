import { NgStyle } from "@angular/common";
import { Component, input, computed } from "@angular/core";
import { PortalComponent } from "@upupa/common";
import { MaterializedWidget, materializeWidget, Widget, WidgetBlueprint } from "./model";

@Component({
    selector: "widget-layout",
    imports: [PortalComponent, NgStyle],
    template: `
        <div style="display: grid; grid-template-columns: repeat(12, 1fr); grid-gap: 5px;">
            @for (widget of materializedWidgets(); track widget.id) {
                <div [ngStyle]="widget.style">
                    <portal [template]="widget.template"></portal>
                </div>
            }
        </div>
    `
})
export class WidgetLayoutComponent {
    blueprints = input.required<WidgetBlueprint[], WidgetBlueprint[]>({ transform: (v) => v ?? [] });
    layout = input<{ cols: []; rows?: []; gap: number }>();
    widgets = input<Widget[]>();

    materializedWidgets = computed<MaterializedWidget[]>(() => {
        const blueprints = this.blueprints();
        return (this.widgets() ?? []).map((widget) => {
            const blueprint = blueprints.find((w) => w.id === widget.template.selector);
            return materializeWidget(widget, blueprint);
        });
    });
}
