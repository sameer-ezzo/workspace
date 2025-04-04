import { PageDescriptor, SortDescriptor, TableDataSource, FilterDescriptor, Term, ReadResult, Key } from "./model";
import { filter } from "./filter.fun";

import { JsonPatch, JsonPointer, Patch } from "@noah-ark/json-patch";
import { computed, Signal, signal, WritableSignal } from "@angular/core";

export function getByPath(obj: any, path: string) {
    const segments = path.split(".");
    let result = obj;
    while (segments.length) {
        const s = segments.shift();
        result = result[s];
    }
    return result;
}

export function compare(a, b): number {
    if (a?.localeCompare) return a.localeCompare(b);
    if (a > b) return 1;
    else if (a < b) return -1;
    else return 0;
}

export class SignalDataSource<T = any, R = T> implements TableDataSource<T, Partial<T>> {
    entries = computed(() => {
        const map = new Map<R, T>();
        for (const item of this.all()) {
            const key = this._key(item);
            map.set(key, item);
        }
        return map;
    });
    constructor(
        readonly all: WritableSignal<T[]>,
        readonly key: keyof T | ((item: T) => R) = (item) => item as unknown as R,
    ) {}

    async load(
        options?: { page?: PageDescriptor; sort?: SortDescriptor; filter?: FilterDescriptor; terms?: Term<T>[]; keys?: Key<T>[] },
        mapper?: (raw: unknown) => T[],
    ): Promise<ReadResult<T>> {
        const all = this.all();
        if (options?.keys) {
            const data = options.keys.map((k) => all.find((item) => this._key(item) === k));
            return { data: mapper ? mapper(data) : data, total: data.length, query: [] };
        } else {
            const data = filter(all, options?.filter, options?.sort, options?.page, options?.terms);
            return { data: mapper ? mapper(data) : data, total: data.length, query: options?.filter ? Array.from(Object.entries(options.filter)) : [] };
        }
    }

    _key(item: T) {
        return typeof this.key === "function" ? this.key(item) : JsonPointer.get(item, this.key as string);
    }

    create(value: Partial<T>) {
        this.all.update((all) => [...(all ?? []), value as T]);
        return Promise.resolve(value);
    }

    put(item: T, value: Partial<T>) {
        const key = this._key(item);
        // const entries = this.entries();
        // const ref = entries.get(key);
        this.all.update((v) => (v ?? []).map((x) => (this._key(x) === key ? (value as T) : x)));

        return Promise.resolve(value);
    }

    patch(item: T, patches: Patch[]) {
        const key = this._key(item);
        const entries = this.entries();
        let ref = entries.get(key);
        if (typeof ref !== "object") ref = {} as T;
        JsonPatch.patch(ref, patches);
        this.all.update((v) => (v ?? []).map((x) => (x === ref ? (ref as T) : x)));
        return Promise.resolve(ref);
    }

    delete(item: T) {
        const key = this._key(item);
        const entries = this.entries();
        const ref = entries.get(key);
        this.all.update((v) => (v ?? []).filter((x) => x !== ref));
        return Promise.resolve(item);
    }
}

export class ClientDataSource<T = any, R = T> extends SignalDataSource<T, R> {
    constructor(all: T[], key: keyof T | ((item: T) => R) = (item) => item as unknown as R) {
        super(signal(all), key);
    }
}
