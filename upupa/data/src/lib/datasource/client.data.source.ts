import { PageDescriptor, SortDescriptor, TableDataSource, FilterDescriptor, Term, ReadResult } from "./model";
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

export class SignalDataSource<T = any, R = T> extends TableDataSource<T, Partial<T>> {
    entries = computed(() => {
        const map = new Map<R, T>();
        for (const item of this.all()) {
            const key = this._key(item);
            map.set(key, item);
        }
        return map;
    });
    constructor(
        public readonly all: WritableSignal<T[]>,
        readonly key: keyof T | ((item: T) => R) = (item) => item as unknown as R,

        mapper: (items: T[]) => T[] = (items) => items,
    ) {
        super(mapper);
    }

    async load(options?: { page?: PageDescriptor; sort?: SortDescriptor; filter?: FilterDescriptor; terms?: Term<T>[] }): Promise<ReadResult<T>> {
        const data = filter(this.all(), options?.filter, options?.sort, options?.page, options?.terms);
        return { data, total: data.length, query: options?.filter ? Array.from(Object.entries(options.filter)) : [] };
    }

    override async getItems(keys: (string | number | symbol)[], keyProperty: string | undefined): Promise<T[]> {
        if (keys == null || keys.length === 0) return [];
        const all = this.all() ?? [];
        return keys.map((k) => all.find((item) => (keyProperty ? k === item?.[keyProperty] : k === item)));
    }

    _key(item: T) {
        return typeof this.key === "function" ? this.key(item) : JsonPointer.get(item, this.key as string);
    }

    override create(value: Partial<T>) {
        this.all.update((all) => [...(all ?? []), value as T]);
        return Promise.resolve(value);
    }

    override put(item: T, value: Partial<T>) {
        const key = this._key(item);
        // const entries = this.entries();
        // const ref = entries.get(key);
        this.all.update((v) => (v ?? []).map((x) => (this._key(x) === key ? (value as T) : x)));

        return Promise.resolve(value);
    }

    override patch(item: T, patches: Patch[]) {
        const key = this._key(item);
        const entries = this.entries();
        let ref = entries.get(key);
        if (typeof ref !== "object") ref = {} as T;
        JsonPatch.patch(ref, patches);
        this.all.update((v) => (v ?? []).map((x) => (x === ref ? (ref as T) : x)));
        return Promise.resolve(ref);
    }

    override delete(item: T) {
        const key = this._key(item);
        const entries = this.entries();
        const ref = entries.get(key);
        this.all.update((v) => (v ?? []).filter((x) => x !== ref));
        return Promise.resolve(item);
    }
}

export class ClientDataSource<T = any, R = T> extends SignalDataSource<T, R> {
    constructor(all: T[], key: keyof T | ((item: T) => R) = (item) => item as unknown as R, mapper: (items: T[]) => T[] = (items) => items) {
        super(signal(all), key, mapper);
    }
}
