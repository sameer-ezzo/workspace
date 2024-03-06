import { Pipe, PipeTransform } from "@angular/core"
import { DomSanitizer, SafeHtml } from "@angular/platform-browser"
import { marked, Renderer } from "marked"


// https://github.com/mermaid-js/mermaid

@Pipe({ name: 'markdown' })
export class MarkdownPipe implements PipeTransform {
    renderer = new Renderer()
    constructor(private _sanitizer: DomSanitizer) {
        this.renderer.link = (href, title, text) => `<a target="_blank" rel="noopener" href="${href}" title="${title}">${text}</a>`
    }

    async transform(markdown: string): Promise<SafeHtml> {
        markdown ??= ''
        if (!markdown || markdown.trim().length === 0) return markdown


        try {
            markdown = await marked(markdown, {
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
                renderer: this.renderer
            })

            return this._sanitizer.bypassSecurityTrustHtml(markdown)

        } catch (e) {
            console.error(e)
            return ''
        }
    }
}
