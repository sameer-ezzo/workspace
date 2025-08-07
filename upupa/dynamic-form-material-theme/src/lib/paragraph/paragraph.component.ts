import { AsyncPipe } from "@angular/common";
import { Component, InjectionToken, computed, inject, input, model } from "@angular/core";
import { UntypedFormControl } from "@angular/forms";
import { DynamicComponent, HtmlPipe, InputBaseComponent, MarkdownPipe, PortalComponent, UtilsModule } from "@upupa/common";

export const PARAGRAPH_RENDERER_TEMPLATE = new InjectionToken<"markdown" | "html" | "none" | DynamicComponent>("PARAGRAPH_RENDERER_TEMPLATE");
@Component({
    selector: "paragraph",
    templateUrl: "./paragraph.component.html",
    styleUrls: ["./paragraph.component.scss"],
    imports: [UtilsModule, PortalComponent, MarkdownPipe, HtmlPipe],
})
export class ParagraphComponent extends InputBaseComponent<string | any> {
    // to avoid setting none existing control input during dynamic form rendering phase.
    defaultRenderer = inject(PARAGRAPH_RENDERER_TEMPLATE, { optional: true }) ?? "none";
    renderer = input<"markdown" | "html" | "none" | DynamicComponent>(this.defaultRenderer || "html");

    rendererTemplate = computed<DynamicComponent | undefined>(() => {
        const r = this.renderer() ?? this.defaultRenderer;
        const t = this.value();
        if (typeof r === "string") return undefined;
        const dc = (r && "component" in r ? r : { component: r }) as DynamicComponent;
        dc.inputs ??= {};
        dc.inputs["readOnly"] = true;
        dc.inputs["value"] = t;
        return dc;
    });
}
