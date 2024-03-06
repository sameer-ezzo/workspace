import { firstValueFrom, Subject } from "rxjs";

export class Deferred<T = unknown> {
    private subject = new Subject<T>()
    promise: Promise<T> = firstValueFrom(this.subject)

    resolve(value: T) {
        this.subject.next(value)
        this.subject.complete()
    }

    reject(reason: Error) {
        this.subject.error(reason)
        this.subject.complete()
    }
}