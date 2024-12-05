import { Pipe } from "@angular/core";
import { MarkedOptions, parse as md } from "marked";

const options: MarkedOptions = {
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
};

@Pipe({ name: "markdown", pure: false, standalone: true })
export class MarkdownPipe {
    transform(markdown: string): string {
        markdown ??= "";
        if (!markdown || markdown.trim().length === 0) return "";
        return md(markdown, options).toString();
    }
}
