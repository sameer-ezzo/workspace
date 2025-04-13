import { EMPTY, Observable, of, ReplaySubject } from "rxjs";
import { filter, map, timeout } from "rxjs/operators";
import { uniqueId } from "@noah-ark/common";


export type EventRecord<T> = { source: any, payload: T, match?: RegExpMatchArray };





export type BrokerClient = {
    send<TInput = any>(pattern: string, data: TInput, source?: any): Observable<any>;
    emit(pattern: string, data: any, source?: any): Observable<never>;
    on<T = any>(pattern: string | RegExp, options?: unknown): Observable<EventRecord<T>>;
}

export abstract class EventBusBase implements BrokerClient {
    private event$ = new ReplaySubject<{ pattern: string, source: any, payload: any }>(1);

    on<T = any>(pattern: string | RegExp, options?: {}): Observable<EventRecord<T>> {
        if (pattern instanceof RegExp) {
            return this.event$.pipe(
                map(e => { return { ...e, match: pattern.exec(e.pattern) } as EventRecord<T> }),
                filter(e => e.match != null),
                // shareReplay()
            );
        }
        return this.event$.pipe(filter(e => e.pattern === pattern))
    }

    emit(pattern: string, payload: any, source?: any): Observable<never> {
        this.event$.next({ pattern, source, payload })
        return EMPTY
    }

    send(pattern: string, payload: any, source?: any): Observable<any> {
        payload.transactionId = uniqueId()
        this.emit(pattern, payload, source)
        const rx = this.on(`${pattern}-reply`)
            .pipe(
                timeout(1000),
                filter(r => r.payload.transactionId === payload.transactionId),
                map(r => r.payload)
            )
        return rx
    }



}