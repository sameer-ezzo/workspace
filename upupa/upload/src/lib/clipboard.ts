import { filter, map } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { Observable, fromEvent } from 'rxjs';



@Injectable({ providedIn: 'root' })
export class ClipboardService {
  filePasteStream: Observable<FileList>;
  constructor() {
    this.paste$ = fromEvent<ClipboardEvent>(window, 'paste');
    this.filePasteStream = fromEvent(window, 'paste').pipe(map((event: ClipboardEvent) => event.clipboardData.files), filter(files => files != null && files.length > 0));
  }

  paste$: Observable<ClipboardEvent>;

  copy(str: string) {
    copyTextToClipboard(str);
  }

}

function fallbackCopyTextToClipboard(text) {
  var textArea = document.createElement("textarea");
  textArea.value = text;

  // Avoid scrolling to bottom
  textArea.style.top = "0";
  textArea.style.left = "0";
  textArea.style.position = "fixed";

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    var successful = document.execCommand('copy');
    var msg = successful ? 'successful' : 'unsuccessful';
    console.log('Fallback: Copying text command was ' + msg);
  } catch (err) {
    console.error('Fallback: Oops, unable to copy', err);
  }

  document.body.removeChild(textArea);
}

function copyTextToClipboard(text) {
  if (!navigator.clipboard) {
    fallbackCopyTextToClipboard(text);
    return;
  }
  navigator.clipboard.writeText(text).then(function () {
    console.log('Async: Copying to clipboard was successful!');
  }, function (err) {
    console.error('Async: Could not copy text: ', err);
  });
}


