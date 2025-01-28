import { JsonPointer, Patch } from "@noah-ark/json-patch";
import { Key, NormalizedItem, PageDescriptor, DataLoaderOptions, SortDescriptor, FilterDescriptor, Term, TableDataSource, ReadResult } from "./model";
import { computed } from "@angular/core";

import { patchState, signalStore, withState } from "@ngrx/signals";
import { updateEntity, removeEntities, setAllEntities, setEntity, withEntities } from "@ngrx/signals/entities";
import { Record } from "twilio/lib/twiml/VoiceResponse";
export type DataAdapterType = "server" | "api" | "client" | "http";

export type DataAdapterDescriptor<TData = any> = {
    type: DataAdapterType;

    keyProperty?: keyof TData;
    displayProperty?: Key<TData>;
    valueProperty?: Key<TData>;
    imageProperty?: Key<TData>;
    options?: DataLoaderOptions<TData>;
} & (({ type: "server"; path: string } | { type: "api"; path: string }) | { type: "client"; data: TData[] });

function DataAdapterStore<T>() {
    return signalStore(
        { protectedState: false },
        withEntities<NormalizedItem<T>>(),
        withState({
            loading: false,
            autoRefresh: true,
            // data: [] as T[],
            error: null as Error,
            allDataLoaded: false,
            page: { pageIndex: 0 } as PageDescriptor,
            sort: null as SortDescriptor,
            filter: {} as FilterDescriptor,
            terms: [] as Term<T>[],
        }),
        // withSelectedEntity(),
    );
}

export class DataAdapter<T = any> extends DataAdapterStore<any>() {
    constructor(
        readonly dataSource: TableDataSource<T>,
        readonly keyProperty?: keyof T,
        readonly displayProperty?: Key<T>,
        readonly valueProperty?: Key<T>,
        readonly imageProperty?: Key<T>,
        options?: DataLoaderOptions<T>,
    ) {
        super();

        const _keyProperties = Array.isArray(keyProperty) ? keyProperty : keyProperty ? [keyProperty] : [];
        const _valueProperties = Array.isArray(valueProperty) ? valueProperty : valueProperty ? [valueProperty] : [];
        const _displayProperties = Array.isArray(displayProperty) ? displayProperty : displayProperty ? [displayProperty] : [];

        const _initial = {
            page: options?.page ?? { pageIndex: 0 },
            sort: options?.sort,
            filter: options?.filter,
            terms: options?.terms ?? [..._displayProperties, ..._keyProperties, ..._valueProperties],
            autoRefresh: options?.autoRefresh === false ? false : true,
        };
        patchState(this, _initial);
    }

    normalized = computed(() => this.entities());

    async load(options?: { page?: PageDescriptor; sort?: SortDescriptor; filter?: FilterDescriptor; terms?: Term<T>[] }): Promise<NormalizedItem<T>[]> {
        const _options = { ...{ page: this.page(), filter: this.filter(), sort: this.sort(), terms: this.terms() }, ...options };
        try {
            patchState(this, { loading: true });
            const readResult: ReadResult = await this.dataSource.load(_options);
            const p = _options.page ?? this.page() ?? { pageIndex: 0 };
            const page = { ...p, length: readResult.total, previousPageIndex: p.pageIndex > 0 ? p.pageIndex - 1 : undefined } as PageDescriptor;

            patchState(this, { ..._options, page, loading: false });
            patchState(this, setAllEntities(readResult.data.map((x) => this.normalize(x))));
            return this.entities();
        } catch (error) {
            patchState(this, { error, loading: false });
            patchState(this, setAllEntities([]));
            return [];
        }
    }

    refresh() {
        return this.load();
    }

    async create(value: Partial<T>, opt: { refresh: boolean } = { refresh: this.autoRefresh() }) {
        const result = await this.dataSource.create(value);

        const n = this.normalize(result);
        patchState(this, setEntity(n));

        if (opt.refresh || this.autoRefresh()) await this.refresh();
        return result;
    }

    async put(item: T, value: Partial<T>, opt: { refresh: boolean } = { refresh: this.autoRefresh() }) {
        const result = await this.dataSource.put(item, value);
        const n = this.normalize(result);
        patchState(this, setEntity(n));
        if (opt.refresh || this.autoRefresh()) await this.refresh();
        return result;
    }

    async patch(item: T, patches: Patch[], opt: { refresh: boolean } = { refresh: this.autoRefresh() }) {
        const result = await this.dataSource.patch(item, patches);

        const n = this.normalize(result);
        patchState(this, updateEntity({ id: n.id, changes: n }));
        if (opt.refresh || this.autoRefresh()) await this.refresh();
        return result;
    }

    async delete(item: T, opt: { refresh: boolean } = { refresh: this.autoRefresh() }): Promise<unknown> {
        const id = this.normalize(item).id;
        const n = this.entities().find((x) => x.id === id);
        const result = await this.dataSource.delete(item);
        patchState(this, removeEntities([n.id]));
        if (opt.refresh || this.autoRefresh()) await this.refresh();
        return result;
    }

    getKeysFromValue(value: Partial<T> | Partial<T>[]): (keyof T)[] {
        if (!value) return [];
        const v = Array.isArray(value) ? value : [value];
        return v.map((x) => this.extract(x, this.keyProperty, x));
    }

    async getItems(keys: (keyof T)[]): Promise<NormalizedItem<T>[]> {
        if (!keys?.length) return [];

        const KEYS = Array.isArray(keys) ? keys : [keys];
        const normalized = this.entities() ?? [];
        const itemsInAdapter: NormalizedItem<T>[] = [];
        const toBeLoaded: Key<T> = [];
        for (const key of KEYS) {
            const n = normalized.find((n) => n.id === key);
            if (n) itemsInAdapter.push(n);
            else toBeLoaded.push(key);
        }
        if (itemsInAdapter.length === KEYS.length) return itemsInAdapter;

        const _items = await this.dataSource.getItems(toBeLoaded, this.keyProperty);
        const _normalized = _items.map((i) => this.normalize(i));
        const _dic = Object.fromEntries(_normalized.map((i) => [i.key, i]));
        return KEYS.map((key) => {
            return toBeLoaded.includes(key) ? _dic[key] : itemsInAdapter.find((i) => i.key === key);
        }).filter((x) => x);
    }

    normalize(item: T): NormalizedItem<T> {
        if (!item)
            return {
                id: null,
                key: null,
                display: null,
                value: null,
                image: null,
                item: null,
                state: null,
                error: `Item ${item} Not Found`,
            } as NormalizedItem<T>;

        const key = this.extract(item, this.keyProperty, item) ?? item;
        const id = `${key}`;

        const display = this.extract(item, this.displayProperty, item, true);
        let valueProperty = Array.isArray(this.valueProperty) ? [this.keyProperty, ...this.valueProperty] : [this.keyProperty, this.valueProperty];
        valueProperty = Array.from(new Set(valueProperty)).filter((x) => x != null);

        // if item is primitive type like string then no need to extract.
        let value = item as any;
        const valueProps = [...new Set(valueProperty.filter((v, i) => v))];
        if (valueProps.length > 1) value = this.extract(item, valueProperty, item);
        else if (valueProps.length === 1) value = valueProps[0] ? item[valueProps[0]] : item; //to handle keyProperty = null (take the item itself as a key)

        const image = this.extract(item, this.imageProperty, undefined);
        return { id, key, display, value, image, item: item, state: "loaded", error: null };
    }

    extract(item: Partial<T>, property: Key<T>, fallback: Partial<T>, flatten = false) {
        if (property && item) {
            if (Array.isArray(property)) {
                if (property.length === 1) return JsonPointer.get(item, property[0] as string, ".");
                const result: Partial<T> = {};
                property.forEach((k) => (result[k] = JsonPointer.get(item, k as string, ".")));
                if (flatten) return Object.values(result).join(" ");
                else return result;
            } else return JsonPointer.get(item, property as string, ".") ?? item;
        } else return fallback;
    }
}

export class SmartMap<V> {
    _weak = new WeakMap<any, V>();
    _strong = new Map<object, V>();

    delete(key: any): boolean {
        const t = typeof key;
        if (t === "object") return this._weak.delete(key);
        else return this._strong.delete(key);
    }
    get(key: any): V | undefined {
        const t = typeof key;
        if (t === "object") return this._weak.get(key);
        else return this._strong.get(key);
    }
    has(key: any): boolean {
        const t = typeof key;
        if (t === "object") return this._weak.has(key);
        else return this._strong.has(key);
    }
    set(key: any, value: V) {
        const t = typeof key;
        if (t === "object") return this._weak.set(key, value);
        else return this._strong.set(key, value);
    }
}
