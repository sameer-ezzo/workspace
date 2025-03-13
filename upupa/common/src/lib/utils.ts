import { OutputEmitterRef, DestroyRef } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Observable, ReplaySubject } from "rxjs";
import { ComponentOutputs } from "./dynamic-component";

export async function waitForOutput<TCom = any, TOut = ComponentOutputs<TCom>, K extends keyof TOut = keyof TOut>(instance: TCom, output: K): Promise<TOut[K]> {
    const emitter = instance[output as any] as OutputEmitterRef<TOut[K]>;
    if (!emitter) throw new Error(`Output ${output as any} not found in ${instance.constructor.name}`);
    return new Promise<any>((resolve) => {
        const sub = emitter.subscribe((e) => {
            sub.unsubscribe();
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

function readInput(input: string, instance = this) {
    if (!(input in instance)) throw new Error(`Input ${input} not found in ${instance.constructor.name}`);
    const inputRef = instance[input];
    if (typeof inputRef === "function") return inputRef();
    return inputRef;
}


export type TypeOrFunc<T> = T | (() => T);