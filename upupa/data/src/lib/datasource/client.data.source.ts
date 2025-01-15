import { PageDescriptor, SortDescriptor, TableDataSource, FilterDescriptor, Term } from "./model";
import { filter } from "./filter.fun";

import { JsonPatch, Patch } from "@noah-ark/json-patch";
import { signal } from "@angular/core";

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

export class ClientDataSource<T = any> extends TableDataSource<T, Partial<T>> {
    all = signal<T[]>([]);
    constructor(all: T[]) {
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

    override put(item: T, value: Partial<T>) {
        const key = this.all().indexOf(item);
        this.all.update((v) => v.map((x, i) => (i === key ? (value as T) : x)));
        return Promise.resolve(value);
    }

    override patch(item: T, patches: Patch[]) {
        const key = this.all().indexOf(item);
        let _item = this.all()[key];
        if (typeof _item !== "object") _item = {} as T;
        JsonPatch.patch(_item, patches);
        this.all.update((v) => v.map((x, i) => (i === key ? _item : x)));
        return Promise.resolve(_item);
    }

    override delete(item: T) {
        this.all.update((all) => all.filter((x) => x !== item));
        return Promise.resolve(item);
    }

    override async getItems(keys: (string | number | symbol)[], keyProperty: string | undefined): Promise<T[]> {
        if (keys == null || keys.length === 0) return [];
        const all = this.all() ?? [];
        return keys.map((k) => all.find((item) => (keyProperty ? k === item?.[keyProperty] : k === item)));
    }
}
