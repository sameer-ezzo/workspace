import { Injectable } from "@angular/core";
import { EventBusBase } from '@noah-ark/event-bus';

@Injectable({ providedIn: 'root' })
export class EventBus extends EventBusBase {
    constructor() {
        super()
        this.init()
    }

    async init() {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            await navigator.serviceWorker.ready
            navigator.serviceWorker.onmessage = (event) => {
                const data = event.data
                const topic = data.topic as string
                super.emit(topic.substring(14), data) //skip the 'notification:' prefix
            };
        }
    }
}
