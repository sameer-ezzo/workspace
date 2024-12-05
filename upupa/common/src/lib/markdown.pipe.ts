import { AsyncPipe, isPlatformBrowser } from "@angular/common";
import { inject, Pipe, PipeTransform, PLATFORM_ID, signal } from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { Observable, of, Subject, switchMap } from "rxjs";

// https://github.com/mermaid-js/mermaid

@Pipe({ name: "markdown", pure: false, standalone: true })
export class MarkdownPipe {
    private readonly platformId = inject(PLATFORM_ID);

    m = new Subject<any>();
    renderer: any;
    constructor(private _sanitizer: DomSanitizer) {
        if (isPlatformBrowser(this.platformId)) {
            if (!this.m) {
                import("marked").then((m) => {
                    this.m.next(m);
                    this.renderer = new m.Renderer();
                    this.renderer.link = (href, title, text) => `<a target="_blank" rel="noopener" href="${href}" title="${title}">${text}</a>`;
                });
            }
        }
    }

    transform(markdown: string) {
        markdown ??= "";
        if (!markdown || markdown.trim().length === 0) return of(markdown);

        return this.m.pipe(
            switchMap(async (m) => {
                return this._sanitizer.bypassSecurityTrustHtml(
                    await m.marked(markdown, {
                        // smartLists: true,
                        // baseUrl: null,
                        // highlight: null,
                        // langPrefix: "lang-",
                        // mangle: true,
                        // smartypants: true,
                        gfm: true,
                        breaks: true,
                        pedantic: true,
                        silent: true,
                        tokenizer: null,
                        walkTokens: null,
                        renderer: this.renderer,
                    })
                );
            })
        );
    }
}
