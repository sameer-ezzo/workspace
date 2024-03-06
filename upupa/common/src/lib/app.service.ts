import { Inject, PLATFORM_ID, Optional } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { Injectable } from '@angular/core';
import { isPlatformBrowser, isPlatformServer, isPlatformWorkerApp, isPlatformWorkerUi } from '@angular/common';
import { BreakpointObserver } from '@angular/cdk/layout';

@Injectable({ 
    providedIn: 'root' 
})
export class AppService {
    side_bar_commands: Command[] = [];
    is_small_screen = false;
    constructor(private titleService: Title,
        private breakpointObserver: BreakpointObserver,
        @Inject(PLATFORM_ID) private platformId: string,
        @Optional() @Inject(DOCUMENT) private doc: any) {
        this.init();
    }
    private _unloadMessage: string;
    init() {
        //responsiveness support
        this.breakpointObserver.observe('(max-width: 599px)').subscribe(result => { this.is_small_screen = result.matches; });
    }

    

    get title() { return this.titleService.getTitle(); }
    set title(value: string) { this.titleService.setTitle(value); }
    get isPlatformBrowser() { return isPlatformBrowser(this.platformId); }
    get isPlatformServer() { return isPlatformServer(this.platformId); }
    get isPlatformWorkerApp() { return isPlatformWorkerApp(this.platformId); }
    get isPlatformWorkerUi() { return isPlatformWorkerUi(this.platformId); }
    get dir(): string { return this.doc ? this.doc.dir : null; }
    set dir(dir: string) { if (this.doc) { this.doc.dir = dir; } }
    get unloadMessage(): string { return this._unloadMessage; }
    set unloadMessage(val: string) {
        this._unloadMessage = val;
        if (this.isPlatformBrowser && window) {
            if (val) {
                window.onbeforeunload = function () { return val; };
            } else { window.onbeforeunload = null; }
        }
    }
}
export class Command {
    text?: String;
    icon?: String;
    link?: String;
    class?: string;
    children?: Command[];
    roles?: string[];
    hide?: boolean;
}