import { JsonPointer, Patch } from "@noah-ark/json-patch";
import { Key, NormalizedItem, PageDescriptor, DataLoaderOptions, SortDescriptor, FilterDescriptor, Term, TableDataSource, ReadResult } from "./model";
import { computed, WritableSignal } from "@angular/core";

import { patchState, signalStore, withState } from "@ngrx/signals";
import { updateEntity, removeEntities, setAllEntities, setEntity, withEntities, EntityId } from "@ngrx/signals/entities";
import { ReplaySubject } from "rxjs";

export type DataAdapterType = "server" | "api" | "client" | "http" | "signal";

/**
 * Describes the configuration for a data adapter.
 *
 * @template TData - The type of data being adapted.
 *
 * @property {DataAdapterType} type - The type of the data adapter. Use "api" or "client".
 *
 * @property {keyof TData} [keyProperty] - The property of the data that serves as the unique key.
 *
 * @property {Key<TData>} [displayProperty] - The property of the data to be used for display purposes.
 *
 * @property {Key<TData>} [valueProperty] - The property of the data to be used as the value.
 *
 * @property {Key<TData>} [imageProperty] - The property of the data to be used for image display.
 *
 * @property {DataLoaderOptions<TData>} [options] - Additional options for loading data.
 *
 * @property {(items: TData[]) => TData[]} [mapper] - A function to map data in the data source before it is normalized in the adapter. Useful for data transformation into Data List View Model.
 */
export type DataAdapterDescriptor<TData = any> = {
    type: DataAdapterType;

    keyProperty?: keyof TData;
    displayProperty?: Key<TData>;
    valueProperty?: Key<TData>;
    imageProperty?: Key<TData>;
    options?: DataLoaderOptions<TData>;

    terms?: Term<any>[];
    page?: Partial<PageDescriptor>;
    sort?: SortDescriptor;
    filter?: Partial<FilterDescriptor>;
    autoRefresh?: boolean;

    mapper?: (items: TData[]) => TData[];
} & (({ type: "server"; path: string } | { type: "api"; path: string }) | { type: "client"; data: TData[] } | { type: "signal"; data: WritableSignal<TData[]> });

/**
 * DataAdapterStore is a function that creates a signal store framework
 * for managing data entities with state management.
 *
 * @template T - The type of the entity being managed.
 * @returns {SignalStore} A signal store configured with entity management.
 */
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
    );
}

/**
 * Describes the base event for DataAdapter.
 * @template T - The type of the entity involved in the event.
 */
export abstract class DataAdapterBaseEvent<T = any> {}

/**
 * Describes the base CRUD event for DataAdapter.
 * @template T - The type of the entity involved in the event.
 */
export abstract class DataAdapterCRUDEvent<T = any> {}

/**
 * Event triggered when an item is created in the data adapter.
 * @template T - The type of the created entity.
 */
export class DataAdapterCreateItemEvent<T = any> extends DataAdapterCRUDEvent<T> {
    constructor(readonly item: NormalizedItem<T>) {
        super();
    }
}

/**
 * Event triggered when an item is updated in the data adapter.
 * @template T - The type of the updated entity.
 */
export class DataAdapterUpdateItemEvent<T = any> extends DataAdapterCRUDEvent<T> {
    constructor(
        readonly previous: T,
        readonly current: NormalizedItem<T>,
    ) {
        super();
    }
}

/**
 * Event triggered when an item is deleted in the data adapter.
 * @template T - The type of the deleted entity.
 */
export class DataAdapterDeleteItemEvent<T = any> extends DataAdapterCRUDEvent<T> {
    constructor(readonly item: NormalizedItem<T>) {
        super();
    }
}

/**
 * DataAdapter is responsible for managing data operations and state
 * for a specific data source.
 *
 * @template T - The type of data items being managed.
 */
export class DataAdapter<T = any> extends DataAdapterStore<any>() {
    // data: [] as T[],

    private readonly _events = new ReplaySubject<DataAdapterCreateItemEvent | DataAdapterUpdateItemEvent | DataAdapterDeleteItemEvent>();
    readonly events = this._events.asObservable();

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
            terms: options?.terms ?? Array.from(new Set(_displayProperties)).map((field) => ({ field, type: "like" })),
            autoRefresh: options?.autoRefresh === false ? false : true,
        };
        patchState(this, _initial);
    }

    normalized = computed(() => this.entities());

    async load(options?: {
        page?: PageDescriptor;
        sort?: SortDescriptor;
        filter?: FilterDescriptor;
        terms?: Term<T>[];
        keys?: (keyof T)[];
        behavior?: "prepend" | "append" | "replace";
        freshness?: "fresh" | "stale";
    }): Promise<NormalizedItem<T>[]> {
        // should we load all data or only the keys that are not loaded already
        // if (options?.keys?.length && options?.freshness === "stale") {
        //     const loadedEntities = [];
        //     const notLoadedKeys = [];

        //     const map = this.entityMap();
        //     for (const key of options.keys) {
        //         const entity = map[key as EntityId];
        //         if (entity) loadedEntities.push(entity);
        //         else notLoadedKeys.push(key);
        //     }

        //     if (!notLoadedKeys.length) return loadedEntities;
        //     options = { ...options, keys: notLoadedKeys };
        // }

        const _options = {
            page: options?.page ?? this.page(),
            filter: options?.filter ?? this.filter(),
            sort: options?.sort ?? this.sort(),
            terms: this.terms(),
            keys: options?.keys,
        };

        try {
            patchState(this, { loading: true });
            const readResult: ReadResult = await this.dataSource.load(_options);
            const selectionMap = this.selectionMap(); // to reserve the selected items

            const p = _options.page ?? this.page() ?? { pageIndex: 0 };
            const page = { ...p, length: readResult.total, previousPageIndex: p.pageIndex > 0 ? p.pageIndex - 1 : undefined } as PageDescriptor;

            const entities = readResult.data.map((x) => {
                const entity = this.normalize(x);
                if (selectionMap[entity.key]) {
                    entity.selected = selectionMap[entity.key].selected;
                    delete selectionMap[entity.key];
                }
                return entity;
            });

            switch (options?.behavior) {
                case "prepend":
                    patchState(this, { ..._options, page, loading: false }, setAllEntities([...entities, ...this.entities()]));
                    break;
                case "append":
                    patchState(this, { ..._options, page, loading: false }, setAllEntities([...this.entities(), ...entities]));
                    break;
                case "replace":
                default:
                    patchState(this, { ..._options, page, loading: false }, setAllEntities(entities));
                    break;
            }

            return this.entities();
        } catch (error) {
            patchState(this, { error, loading: false }, setAllEntities([]));
            return [];
        }
    }

    protected _select(
        value: Partial<T> | Partial<T>[],
        options: {
            select?: "select" | "unselect" | "toggle";
            clearSelection?: boolean;
        } = {
            select: "select",
            clearSelection: false,
        },
    ) {
        if (!value) throw new Error("No value provided");
        const _v = Array.isArray(value) ? value : [value];

        const records = _v.map((x) => ({ key: this.extract(x, this.keyProperty, x), value: x }));
        const entities = [];
        for (const entity of this.entities()) {
            const _i = records.findIndex((k) => k.key === entity.key);
            if (_i == -1) {
                if (options?.clearSelection) entities.push({ ...entity, selected: false } as NormalizedItem<T>);
                else entities.push(entity);
            } else {
                records.splice(_i, 1);

                if (!options?.select || options.select === "select") entity.selected = true;
                else if (options.select === "unselect") entity.selected = false;
                else if (options.select === "toggle") entity.selected = !entity.selected;
                entities.push({ ...entity, selected: entity.selected } as NormalizedItem<T>);
            }
        }

        for (const record of records) {
            const entity = this.normalize(record.value as T);
            entity.selected = options?.select === "select" ? true : false;
            entities.push(entity);
        }
        if (entities.length) patchState(this, setAllEntities(entities));

        if (records.length) {
            // some keys are not loaded
            this.load({ keys: records.map((x) => x.key), behavior: "prepend" });
        }

        return this.selection();
    }

    select(v: Partial<T> | Partial<T>[], options: { clearSelection?: boolean } = { clearSelection: false }) {
        return this._select(v, { ...options, select: "select" });
    }
    unselect(v: Partial<T> | Partial<T>[]) {
        return this._select(v, { select: "unselect" });
    }
    toggle(v: Partial<T> | Partial<T>[]) {
        return this._select(v, { select: "toggle" });
    }

    selectAll() {
        const entities = this.entities().map((x) => ({ ...x, selected: true }) as NormalizedItem<T>);
        patchState(this, setAllEntities(entities));
    }
    unselectAll() {
        const entities = this.entities().map((x) => ({ ...x, selected: false }) as NormalizedItem<T>);
        patchState(this, setAllEntities(entities));
    }

    selection = computed(() => this.entities().filter((x) => x.selected));
    selectionMap = computed(() => Object.fromEntries(this.selection().map((x) => [x.key, x])));

    refresh() {
        return this.load();
    }

    updateState(item: T, state: "loading" | "loaded" | "error", error?: string) {
        const n = this.normalize(item);
        if (!this.entities().find((x) => x.id === n.id)) return;
        patchState(this, updateEntity({ id: n.id, changes: { ...n, state, error } }));
    }

    async create(value: Partial<T>, opt: { refresh: boolean } = { refresh: this.autoRefresh() }) {
        const result = await this.dataSource.create(value);

        const n = this.normalize(result);
        patchState(this, setEntity(n));

        this._events.next(new DataAdapterCreateItemEvent(n));
        if (opt.refresh || this.autoRefresh()) await this.refresh();
        return result;
    }

    async put(item: T, value: Partial<T>, opt: { refresh: boolean } = { refresh: this.autoRefresh() }) {
        const result = await this.dataSource.put(item, value);
        const n = this.normalize(result);
        patchState(this, setEntity(n));
        this._events.next(new DataAdapterUpdateItemEvent(item, n));
        if (opt.refresh || this.autoRefresh()) await this.refresh();
        return result;
    }

    async patch(item: T, patches: Patch[], opt: { refresh: boolean } = { refresh: this.autoRefresh() }) {
        const result = await this.dataSource.patch(item, patches);

        const n = this.normalize(result);
        patchState(this, updateEntity({ id: n.id, changes: n }));
        this._events.next(new DataAdapterUpdateItemEvent(item, n));
        if (opt.refresh || this.autoRefresh()) await this.refresh();
        return result;
    }

    async delete(item: T, opt: { refresh: boolean } = { refresh: this.autoRefresh() }): Promise<unknown> {
        const id = this.normalize(item).id;
        const n = this.entities().find((x) => x.id === id);
        const result = await this.dataSource.delete(item);
        patchState(this, removeEntities([n.id]));
        this._events.next(new DataAdapterDeleteItemEvent(n));
        if (opt.refresh || this.autoRefresh()) await this.refresh();
        return result;
    }

    getKeysFromValue(value: Partial<T> | Partial<T>[]): (keyof T)[] {
        if (!value) return [];
        const v = Array.isArray(value) ? value : [value];
        return v.map((x) => this.extract(x, this.keyProperty, x));
    }

    // async getItems(keys: (keyof T)[]): Promise<NormalizedItem<T>[]> {
    //     if (!keys?.length) return [];

    //     const KEYS = Array.isArray(keys) ? keys : [keys];
    //     const normalized = this.entities() ?? [];
    //     const itemsInAdapter: NormalizedItem<T>[] = [];
    //     const toBeLoaded: Key<T> = [];
    //     for (const key of KEYS) {
    //         const n = normalized.find((n) => n.id === key);
    //         if (n) itemsInAdapter.push(n);
    //         else toBeLoaded.push(key);
    //     }
    //     if (itemsInAdapter.length === KEYS.length) return itemsInAdapter;

    //     patchState(this, { loading: true });
    //     const _items = await this.dataSource.getItems(toBeLoaded, this.keyProperty);
    //     patchState(this, { loading: false });

    //     const _normalized = _items.map((i) => this.normalize(i));
    //     const _dic = Object.fromEntries(_normalized.map((i) => [i.key, i]));
    //     return KEYS.map((key) => {
    //         return toBeLoaded.includes(key) ? _dic[key] : itemsInAdapter.find((i) => i.key === key);
    //     }).filter((x) => x);
    // }

    normalize(item: T, selected?: boolean): NormalizedItem<T> {
        if (!item)
            return {
                id: null,
                key: null,
                display: null,
                value: null,
                image: null,
                item: null,
                state: null,
                selected: selected,
                error: `Item ${item} Not Found`,
            } as NormalizedItem<T>;

        const key = this.extract(item, this.keyProperty, item) ?? item;
        const id = `${key}`;
        const item_t = typeof item;

        const display = this.extract(item, this.displayProperty, item_t == "string" || item_t == "number" ? item : undefined, true);
        let valueProperty = Array.isArray(this.valueProperty) ? [this.keyProperty, ...this.valueProperty] : [this.keyProperty, this.valueProperty];
        valueProperty = Array.from(new Set(valueProperty)).filter((x) => x != null);

        // if item is primitive type like string then no need to extract.
        let value = item as any;
        const valueProps = [...new Set(valueProperty.filter((v, i) => v))];
        if (valueProps.length > 1) value = this.extract(item, valueProperty, item);
        else if (valueProps.length === 1) value = valueProps[0] ? item[valueProps[0]] : item; //to handle keyProperty = null (take the item itself as a key)

        const image = this.extract(item, this.imageProperty, undefined);
        return { id, key, display, value, image, item: item, state: "loaded", error: null, selected };
    }

    extract(item: Partial<T>, property: Key<T>, fallback: Partial<T>, flatten = false) {
        if (property && item) {
            if (Array.isArray(property)) {
                if (property.length === 1) return JsonPointer.get(item, property[0] as string, ".");
                const result: Partial<T> = {};
                property.forEach((k) => (result[k] = JsonPointer.get(item, k as string, ".")));
                if (flatten) return Object.values(result).join(" ");
                else return result;
            } else return JsonPointer.get(item, property as string, ".") ?? fallback;
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
