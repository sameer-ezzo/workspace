import { Pipe, PipeTransform } from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";

const addProtocolToURL = (url) => {
    if (!url.match(/^https?:\/\//i) && !url.match(/^ftp:\/\//i)) {
        return `https://${url}`;
    }
    return url;
};

@Pipe({ name: "html" })
export class HtmlPipe implements PipeTransform {
    constructor(private _sanitizer: DomSanitizer) {}

    transform(html: string): SafeHtml {
        if (!html || html.trim().length === 0) return html;
        try {
            const urlPattern = /((https?:\/\/)?(www\.)?([a-zA-Z0-9-]+)\.([a-zA-Z0-9-]+)(\.[a-zA-Z0-9-]+)?(\/[^\s]*)?)/g;
            const t = html
                .replace(/&nbsp/g, " ")
                .replace(/\n/g, "<br/>")
                .replace(urlPattern, (match) => {
                    const urlWithProtocol = addProtocolToURL(match);
                    return `<a target="_blank" rel="noopener" rel="noreferrer" href="${urlWithProtocol}">${match}</a>`;
                });
            return this._sanitizer.bypassSecurityTrustHtml(t);
        } catch (e) {
            console.error(e);
            return html;
        }
    }
}

@Pipe({ name: "html", standalone: true })
export class HtmlPipeStandalone implements PipeTransform {
    constructor(private _sanitizer: DomSanitizer) {}

    transform(html: string): SafeHtml {
        if (!html || html.trim().length === 0) return html;
        try {
            const urlPattern = /((https?:\/\/)?(www\.)?([a-zA-Z0-9-]+)\.([a-zA-Z0-9-]+)(\.[a-zA-Z0-9-]+)?(\/[^\s]*)?)/g;
            const t = html
                .replace(/&nbsp/g, " ")
                .replace(/\n/g, "<br/>")
                .replace(urlPattern, (match) => {
                    const urlWithProtocol = addProtocolToURL(match);
                    return `<a target="_blank" rel="noopener" rel="noreferrer" href="${urlWithProtocol}">${match}</a>`;
                });
            return this._sanitizer.bypassSecurityTrustHtml(t);
        } catch (e) {
            console.error(e);
            return html;
        }
    }
}
