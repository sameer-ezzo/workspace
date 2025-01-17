import { PageDescriptor, SortDescriptor, TableDataSource, FilterDescriptor, Term } from "./model";
import { filter } from "./filter.fun";

import { JsonPatch, JsonPointer, Patch } from "@noah-ark/json-patch";
import { computed, signal } from "@angular/core";

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

export class ClientDataSource<T = any, R = T> extends TableDataSource<T, Partial<T>> {
    all = signal<T[]>([]);
    entries = computed(() => {
        const map = new Map<R, T>();
        for (const item of this.all()) {
            const key = this._key(item);
            map.set(key, item);
        }
        return map;
    });
    constructor(
        all: T[],
        public key: string | ((item: T) => R) = (item) => item as unknown as R,
    ) {
        super();
        this.all.set(all);
    }

    async load(options?: { page?: PageDescriptor; sort?: SortDescriptor; filter?: FilterDescriptor; terms?: Term<T>[] }): Promise<T[]> {
        return filter(this.all(), options.filter, options.sort, options.page, options.terms);
    }

    override create(value: Partial<T>) {
        this.all.update((all) => [...all, value as T]);
        return Promise.resolve(value);
    }

    _key(item: T) {
        return typeof this.key === "string" ? JsonPointer.get(item, this.key) : this.key(item);
    }

    override put(item: T, value: Partial<T>) {
        const key = this._key(item);
        const entries = this.entries();
        const ref = entries.get(key);
        // this.all.update((v) => v.map((x) => (x === ref ? (value as T) : x)));
        this.all.set(this.all().map((x) => (x === ref ? (value as T) : x)));

        return Promise.resolve(value);
    }

    override patch(item: T, patches: Patch[]) {
        const key = this._key(item);
        const entries = this.entries();
        let ref = entries.get(key);
        if (typeof ref !== "object") ref = {} as T;
        JsonPatch.patch(ref, patches);
        this.all.update((v) => v.map((x) => (x === ref ? (ref as T) : x)));
        return Promise.resolve(ref);
    }

    override delete(item: T) {
        const key = this._key(item);
        const entries = this.entries();
        const ref = entries.get(key);
        this.all.update((v) => v.filter((x) => x !== ref));
        return Promise.resolve(item);
    }

    override async getItems(keys: (string | number | symbol)[], keyProperty: string | undefined): Promise<T[]> {
        if (keys == null || keys.length === 0) return [];
        const all = this.all() ?? [];
        return keys.map((k) => all.find((item) => (keyProperty ? k === item?.[keyProperty] : k === item)));
    }
}
