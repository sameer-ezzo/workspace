import { PageDescriptor, SortDescriptor, TableDataSource, FilterDescriptor, Term, ReadResult, Key } from "./model";
import { filter } from "./filter.fun";

import { JsonPatch, JsonPointer, Patch } from "@noah-ark/json-patch";
import { computed, InputSignal, Signal, signal, WritableSignal } from "@angular/core";
import { cloneDeep } from "@noah-ark/common";

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
    readonly allDataLoaded = signal(false);
    private readonly _all: WritableSignal<T[]> = signal<T[]>([]);
    get all(): Signal<T[]> {
        return computed(() => this._all());
    }
    set all(items: InputSignal<T[]> | Signal<T[]> | WritableSignal<T[]> | T[]) {
        if (items == null) items = [];
        this._all.set(items instanceof Array ? items : items());
        this.allDataLoaded.set(true);
    }

    entries = computed(() => {
        const map = new Map<R, T>();
        for (const item of this._all()) {
            const key = this._key(item);
            map.set(key, item);
        }
        return map;
    });
    constructor(all: InputSignal<T[]> | Signal<T[]> | WritableSignal<T[]>, readonly key: keyof T | ((item: T) => R) = (item) => item as unknown as R) {
        this._all.set(all());
    }

    async load(options?: { page?: PageDescriptor; sort?: SortDescriptor; filter?: FilterDescriptor; terms?: Term<T>[]; keys?: Key<T>[] }): Promise<ReadResult<T>> {
        const _opts = cloneDeep(options);
        const all = this._all();
        if (_opts?.keys) {
            const data = _opts.keys.map((k) => all.find((item) => this._key(item) === k));
            return { data: data, total: data.length, query: [] };
        } else {
            const data = filter(all, _opts?.filter, _opts?.sort, _opts?.page, _opts?.terms);
            return { data: data, total: data.length, query: _opts?.filter ? Array.from(Object.entries(_opts.filter)) : [] };
        }
    }

    _key(item: T) {
        if (this.key == null) return this.all().findIndex((x) => x === item);
        if (typeof this.key === "function") return this.key(item);
        if (typeof this.key === "string") {
            return JsonPointer.get(item, this.key as string);
        }
        return item;
    }

    create(value: Partial<T>) {
        this._all.update((all) => [...(all ?? []), value as T]);
        return Promise.resolve(value);
    }

    put(item: T, value: Partial<T>) {
        const key = this._key(item);
        // const entries = this.entries();
        // const ref = entries.get(key);
        const all = this._all() ?? [];
        const ref = all.find((x) => this._key(x) === key);
        if (ref) {
            this._all.update((v) => (v ?? []).map((x) => (this._key(x) === key ? (value as T) : x)));
            return Promise.resolve(value);
        } else {
            return this.create(value);
        }
    }

    patch(item: T, patches: Patch[]) {
        const key = this._key(item);
        const entries = this.entries();
        let ref = entries.get(key);
        if (typeof ref !== "object") ref = {} as T;
        JsonPatch.patch(ref, patches);
        this._all.update((v) => (v ?? []).map((x) => (x === ref ? (ref as T) : x)));
        return Promise.resolve(ref);
    }

    delete(item: T) {
        const key = this._key(item);
        const entries = this.entries();
        const ref = entries.get(key);
        if (!ref) {
           return Promise.resolve(item);
        }
        this._all.update((v) => (v ?? []).filter((x) => x !== ref));
        return Promise.resolve(item);
    }
}

export class ClientDataSource<T = any, R = T> extends SignalDataSource<T, R> {
    constructor(all: T[], key: keyof T | ((item: T) => R) = (item) => item as unknown as R) {
        super(signal(all), key);
    }
}
