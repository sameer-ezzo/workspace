import { filter, map } from "rxjs/operators";
import { inject, Injectable } from "@angular/core";
import { Observable, fromEvent } from "rxjs";
import { DOCUMENT } from "@angular/common";

@Injectable({ providedIn: "root" })
export class ClipboardService {
    filePasteStream: Observable<FileList>;
    constructor() {
        this.paste$ = fromEvent<ClipboardEvent>(window, "paste");
        this.filePasteStream = fromEvent(window, "paste").pipe(
            map((event: ClipboardEvent) => event.clipboardData.files),
            filter((files) => files != null && files.length > 0)
        );
    }

    paste$: Observable<ClipboardEvent>;

    private readonly doc = inject(DOCUMENT);
    copy(str: string) {
        copyTextToClipboard(this.doc, str);
    }
}

function fallbackCopyTextToClipboard(doc, text) {
    var textArea = doc.createElement("textarea");
    textArea.value = text;

    // Avoid scrolling to bottom
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";

    doc.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        var successful = doc.execCommand("copy");
        var msg = successful ? "successful" : "unsuccessful";
        console.log("Fallback: Copying text command was " + msg);
    } catch (err) {
        console.error("Fallback: Oops, unable to copy", err);
    }

    doc.body.removeChild(textArea);
}

function copyTextToClipboard(doc, text) {
    if (!navigator.clipboard) {
        fallbackCopyTextToClipboard(doc, text);
        return;
    }
    navigator.clipboard.writeText(text).then(
        function () {
            console.log("Async: Copying to clipboard was successful!");
        },
        function (err) {
            console.error("Async: Could not copy text: ", err);
        }
    );
}
