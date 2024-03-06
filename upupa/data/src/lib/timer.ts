import { never, Subject } from "rxjs";

export class Timer extends Subject<never | void> {

    private _timerObj: any;

    constructor(private ms: number) {
        super();
        this.start();
    }

    stop() {
        if (this._timerObj) {
            clearInterval(this._timerObj);
            this._timerObj = null;
        }
        return this;
    }

    // start timer using current settings (if it's not already running)
    start() {
        if (!this._timerObj) {
            this.stop();
            this._timerObj = setInterval(() => this.next(), this.ms);
        }
        return this;
    }

    reset(newT: number = null) {
        if (newT) this.ms = newT;
        return this.stop().start();
    }
}
