import { OutputEmitterRef, DestroyRef, inject, LOCALE_ID } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Observable, ReplaySubject } from "rxjs";
import { ComponentOutputs } from "./dynamic-component";
import { SIGNAL } from "@angular/core/primitives/signals";

export async function waitForOutput<TCom = any, TOut = ComponentOutputs<TCom>, K extends keyof TOut = keyof TOut>(instance: TCom, output: K): Promise<TOut[K]> {
    const emitter = instance[output as any] as OutputEmitterRef<TOut[K]>;
    if (!emitter) throw new Error(`Output ${output as any} not found in ${instance.constructor.name}`);
    return new Promise<any>((resolve) => {
        emitter.subscribe((e) => {
            resolve(e);
        });
    });
}

export function listenOnOutput<TCom = any, TOut = ComponentOutputs<TCom>, K extends keyof TOut = keyof TOut>(instance: TCom, output: K): Observable<TOut[K]> {
    const emitter = instance[output as any] as OutputEmitterRef<TOut[K]>;
    if (!emitter) throw new Error(`Output ${output as any} not found in ${instance.constructor.name}`);
    const destroyRef = instance["injector"]?.get(DestroyRef);
    const sub = new ReplaySubject<TOut[K]>(1);
    emitter.subscribe((e) => sub.next(e));

    const stream$ = destroyRef ? sub.pipe(takeUntilDestroyed(destroyRef)) : sub;
    // test if the stream$ is becoming a memory leak (should print completed)
    // stream$.subscribe({
    //     next: (e) => console.log(`Output ${output as any} emitted`, e),
    //     complete: () => console.log(`Output ${output as any} completed`),
    // });
    return stream$;
}

export function isClass(func) {
    return typeof func === "function" && func.prototype?.constructor !== undefined;
}

export function isSignal(func) {
    return typeof func === "function" && func[SIGNAL];
}

export function local() {
    return inject(LOCALE_ID);
}

export function language() {
    return local().split("-")[0];
}
