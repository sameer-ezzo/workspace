import { Component, ElementRef, Input, OnChanges, Renderer2, SimpleChanges, computed, inject, input, signal } from "@angular/core";
import { UntypedFormControl } from "@angular/forms";
import { DomSanitizer } from "@angular/platform-browser";
import { HtmlPipe, MarkdownPipe, UtilsModule } from "@upupa/common";
// import { EditorJsInputComponent } from "@upupa/editor-js";

@Component({
    selector: "paragraph",
    templateUrl: "./paragraph.component.html",
    styleUrls: ["./paragraph.component.scss"],
    standalone: true,
    imports: [UtilsModule, MarkdownPipe],
})
export class ParagraphComponent {
    control = input<UntypedFormControl>();
    text = input<string | any>();
    renderer = input<"markdown" | "html" | "none">("none");

    rendererC = computed(() => {
        if (typeof this.text() === "string") return this.renderer();
        return "editor-js";
    });
    // renderedText = signal<string>();
    private readonly _sanitizer = inject(DomSanitizer);
    private readonly host = inject(ElementRef);
    private readonly _renderer = inject(Renderer2);
    // ngOnChanges(changes: SimpleChanges): void {
    //     if (changes["text"] || changes["renderer"]) {
    //         if (this.renderer() === "markdown") this.renderedText.set(new MarkdownPipe().transform(this.text()));
    //         else if (this.renderer() === "html") this.renderedText.set(new HtmlPipe(this._sanitizer).transform(this.text()).toString());
    //         else this.renderedText.set(this.text());
    //         this._renderer.setProperty(this.host.nativeElement, "innerHTML", this.renderedText());
    //     }
    // }
}
