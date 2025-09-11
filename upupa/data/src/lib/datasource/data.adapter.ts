import { JsonPointer, Patch } from "@noah-ark/json-patch";
import { Key, NormalizedItem, PageDescriptor, DataLoaderOptions, SortDescriptor, FilterDescriptor, Term, TableDataSource, ReadResult } from "./model";
import { computed, InputSignal, Resource, signal, Signal, WritableSignal } from "@angular/core";
import { patchState, signalStore, withState } from "@ngrx/signals";
import { updateEntity, removeEntities, setAllEntities, setEntity, withEntities, EntityId } from "@ngrx/signals/entities";
import { BehaviorSubject, combineLatest, filter, first, firstValueFrom, ReplaySubject, timeout } from "rxjs";
import { randomString } from "@noah-ark/common";

export type DataAdapterType = "server" | "api" | "client" | "http" | "signal" | "resource";

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
    groupProperty?: Key<TData>;
    options?: DataLoaderOptions<TData>;

    terms?: Term<any>[];
    page?: Partial<PageDescriptor>;
    sort?: SortDescriptor;
    filter?: Partial<FilterDescriptor>;
    autoRefresh?: boolean;

    mapper?: (items: TData[]) => TData[];
} & (
    | ({ type: "server"; path: string } | { type: "api"; path: string })
    | { type: "client"; data: TData[] }
    | { type: "signal"; data: InputSignal<TData[]> | Signal<TData[]> | WritableSignal<TData[]> }
    | { type: "resource"; resource: Resource<TData[]> } //this could be used as a general interactive data source based on the resource api syntax
);

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
            keys: [] as (keyof T)[],
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

    private _consumer = new BehaviorSubject<number>(0);
    private _producer = new BehaviorSubject<number>(1);

    async load(options?: {
        page?: PageDescriptor;
        sort?: SortDescriptor;
        filter?: FilterDescriptor;
        terms?: Term<T>[];
        keys?: (keyof T)[];
        behavior?: "prepend" | "append" | "replace";
        freshness?: "fresh" | "stale";
    }): Promise<NormalizedItem<T>[]> {
        const consumer = this._consumer.getValue() + 1;
        this._consumer.next(consumer);
        await firstValueFrom(
            this._producer.pipe(
                filter((x) => x === consumer),
                timeout(30000),
            ),
        );
        return this._load(options);
    }

    async _load(options?: {
        page?: PageDescriptor;
        sort?: SortDescriptor;
        filter?: FilterDescriptor;
        terms?: Term<T>[];
        keys?: (keyof T)[];
        behavior?: "prepend" | "append" | "replace";
    }): Promise<NormalizedItem<T>[]> {
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

            const fetchedEntities = readResult.data.map((x, idx) => {
                const entity = this.normalize(x);
                entity.selected = selectionMap[entity.key]?.selected ?? false;
                entity.state = this.entityMap()[entity.key]?.state ?? "loaded";
                entity.error = this.entityMap()[entity.key]?.error ?? null;

                return entity;
            });

            const entityMap = this.entityMap();

            if (!options?.behavior || options.behavior === "replace") {
                const selected = this.entities().filter((x) => x.selected && !fetchedEntities.find((y) => y.key === x.key));
                const all = [...selected, ...fetchedEntities].map((c, index) => ({
                    ...c,
                    index,
                    id: (!!this.keyProperty ? c.key : index) as string,
                }));

                patchState(this, { ..._options, page, loading: false, allDataLoaded: this.dataSource.allDataLoaded() }, setAllEntities(all as NormalizedItem<T>[]));
            } else {
                // avoid changing index of duplicates (prepend/append only unique items)
                const unique = [];
                const duplicates = [];
                for (const entity of fetchedEntities) {
                    if (entityMap[entity.key] === undefined) unique.push(entity);
                    else {
                        entity.selected = selectionMap[entity.key]?.selected ?? false;
                        duplicates.push(entity);
                    }
                }

                // replace duplicates in the current entities
                const entities = this.entities();
                for (const entity of duplicates) {
                    const i = entities.findIndex((x) => x.key === entity.key);
                    if (i > -1) entities[i] = entity;
                }

                // prepend/append unique items
                if (options.behavior === "prepend") {
                    const all = [...unique, ...entities].map((c, index) => ({
                        ...c,
                        index,
                        id: (!!this.keyProperty ? c.key : index) as string,
                    }));
                    patchState(this, { ..._options, page, loading: false, allDataLoaded: this.dataSource.allDataLoaded() }, setAllEntities(all));
                } else {
                    const all = [...entities, ...unique].map((c, index) => ({
                        ...c,
                        index,
                        id: (!!this.keyProperty ? c.key : index) as string,
                    }));
                    patchState(this, { ..._options, page, loading: false, allDataLoaded: this.dataSource.allDataLoaded() }, setAllEntities(all));
                }
            }

            return this.entities();
        } catch (error) {
            patchState(this, { error, loading: false, allDataLoaded: this.dataSource.allDataLoaded() }, setAllEntities([]));
            return [];
        } finally {
            this._producer.next(this._producer.getValue() + 1);
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
                let s = entity.selected;
                // entity.selected = true; // this will not work because the entity is immutable
                if (!options?.select || options.select === "select") s = true;
                else if (options.select === "unselect") s = false;
                else if (options.select === "toggle") s = !entity.selected;
                patchState(this, updateEntity({ id: entity.id, changes: { ...entity, selected: s } }));
                entities.push({ ...entity, selected: s } as NormalizedItem<T>);
            }
        }

        for (const record of records) {
            const entity = this.normalize(record.value as T);
            entity.selected = options?.select === "select" ? true : false;
            entities.push(entity);
        }

        if (entities.length) patchState(this, setAllEntities(entities.map((c, index) => ({ ...c, index, id: (!!this.keyProperty ? c.key : index) as string }))));

        if (records.length) {
            // some keys are not loaded
            this.load({ keys: records.map((x) => x.key).filter((x) => x != undefined), behavior: "prepend" });
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
        if (!this.loading()) return this.load();
        else return Promise.resolve(this.entities());
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
        let id = !!this.keyProperty ? key : randomString(12);

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
                let result: Partial<T> = undefined;
                property.forEach((k) => {
                    const v = JsonPointer.get(item, k as string, ".");
                    if (!!v) {
                        result ??= {};
                        result[k] = v;
                    }
                });

                if (flatten && result) return Object.values(result).join(" ");
                else return result;
            } else return JsonPointer.get(item, property as string, ".") ?? fallback;
        } else return fallback;
    }
    find(key: Key<T>) {
        return this.entities().find((x) => x.key === key);
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
