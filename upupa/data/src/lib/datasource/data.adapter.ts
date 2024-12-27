import { JsonPointer, Patch } from "@noah-ark/json-patch";
import { Key, NormalizedItem, PageDescriptor, DataLoaderOptions, SortDescriptor, FilterDescriptor, Term, TableDataSource } from "./model";
import { computed } from "@angular/core";
import { patchState, signalStore, withState } from "@ngrx/signals";

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
        withState({
            loading: false,
            data: [] as T[],
            error: null as Error,
            allDataLoaded: false,
            page: { pageIndex: 0 } as PageDescriptor,
            sort: null as SortDescriptor,
            filter: {} as FilterDescriptor,
            terms: [] as Term<T>[],
        }),
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
        };
        patchState(this, _initial);
    }

    normalized = computed(() => this.data().map((x) => this.normalize(x)));

    async load(options?: { page?: PageDescriptor; sort?: SortDescriptor; filter?: FilterDescriptor; terms?: Term<T>[] }): Promise<NormalizedItem<T>[]> {
        const _options = { ...{ page: this.page(), filter: this.filter(), sort: this.sort(), terms: this.terms() }, ...options };
        try {
            patchState(this, { loading: true });
            const items = await this.dataSource.load(_options);
            patchState(this, { data: items, ..._options, loading: false });
            return this.normalized();
        } catch (error) {
            patchState(this, { data: [], error, loading: false });
            return [];
        }
    }

    refresh() {
        return this.load();
    }

    async create(value: Partial<T>): Promise<unknown> {
        return this.dataSource.create(value);
    }

    async put(item: T, value: Partial<T>): Promise<unknown> {
        return this.dataSource.put(item, value);
    }

    async patch(item: T, patches: Patch[]): Promise<unknown> {
        return this.dataSource.patch(item, patches);
    }

    async delete(item: T): Promise<unknown> {
        return this.dataSource.delete(item);
    }

    getKeysFromValue(value: Partial<T> | Partial<T>[]): (keyof T)[] {
        if (!value) return [];
        const v = Array.isArray(value) ? value : [value];
        return v.map((x) => this.extract(x, this.keyProperty, x));
    }

    async getItems(keys: (keyof T)[]): Promise<NormalizedItem<T>[]> {
        if (!keys?.length) return [];

        const KEYS = Array.isArray(keys) ? keys : [keys];
        const normalized = this.normalized() ?? [];
        const itemsInAdapter: NormalizedItem<T>[] = [];
        const toBeLoaded: Key<T> = [];
        for (const key of KEYS) {
            const n = normalized.find((n) => n.key === key);
            if (n) itemsInAdapter.push(n);
            else toBeLoaded.push(key);
        }
        if (itemsInAdapter.length === KEYS.length) return itemsInAdapter;

        const _items = await this.dataSource.getItems(toBeLoaded, this.keyProperty);
        const _normalized = _items.map((i) => this.normalize(i));
        const _dic = Object.fromEntries(_normalized.map((i) => [i.key, i]));
        return KEYS.map((key) => {
            return toBeLoaded.includes(key) ? _dic[key] : itemsInAdapter.find((i) => i.key === key);
        });
    }

    normalize(item: T): NormalizedItem<T> {
        if (!item)
            return {
                key: null,
                display: null,
                value: null,
                image: null,
                item: null,
            } as NormalizedItem<T>;

        const key = this.extract(item, this.keyProperty, item) ?? item;

        const display = this.extract(item, this.displayProperty, item, true);
        let valueProperty = Array.isArray(this.valueProperty) ? [this.keyProperty, ...this.valueProperty] : [this.keyProperty, this.valueProperty];
        valueProperty = Array.from(new Set(valueProperty)).filter((x) => x != null);

        // if item is primitive type like string then no need to extract.
        let value = item as any;
        const valueProps = [...new Set(valueProperty.filter((v, i) => v))];
        if (valueProps.length > 1) value = this.extract(item, valueProperty, item);
        else if (valueProps.length === 1) value = valueProps[0] ? item[valueProps[0]] : item; //to handle keyProperty = null (take the item itself as a key)

        const image = this.extract(item, this.imageProperty, undefined);
        return { key, display, value, image, item };
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
