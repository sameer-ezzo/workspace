import { isPlatformBrowser } from "@angular/common";
import { afterNextRender, inject, Injectable, PLATFORM_ID } from "@angular/core";
import { EventBusBase } from "@noah-ark/event-bus";

@Injectable({ providedIn: "root" })
export class EventBus extends EventBusBase {
    private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
    constructor() {
        super();
        this.init();
    }

    async init() {
        if (this.isBrowser) return;
        await navigator.serviceWorker.ready;
        navigator.serviceWorker.onmessage = (event) => {
            const data = event.data;
            const topic = data.topic as string;
            super.emit(topic.substring(14), data); //skip the 'notification:' prefix
        };
    }
}
