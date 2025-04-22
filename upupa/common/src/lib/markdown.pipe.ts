import { AsyncPipe } from "@angular/common";
import { inject, Pipe } from "@angular/core";
import { from, map } from "rxjs";

const options = {
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
    private readonly _asyncPipe = inject(AsyncPipe);

    transform(markdown: string): any {
        markdown ??= "";
        // lazyload marked to reduce bundle size
        const rx = from(import("marked")).pipe(
            map(({ marked }) => {
                if (!markdown || markdown.trim().length === 0) return "";
                return marked(markdown, options);
            }),
        );

        return this._asyncPipe.transform(rx);
    }
}
