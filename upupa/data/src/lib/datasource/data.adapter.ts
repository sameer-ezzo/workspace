import { JsonPointer } from "@noah-ark/json-patch"
import { Subscription, Observable, ReplaySubject, of, firstValueFrom } from "rxjs"
import { ClientDataSource } from "./client.data.source"
import { filterNormalized } from "./filter.fun"
import { Key, NormalizedItem, PageDescriptor, ProviderOptions, SortDescriptor, ITableDataSource, FilterDescriptor } from "./model"
import { map, tap } from 'rxjs/operators'
import { HttpServerDataSourceOptions } from "./http-server-data-source"

export type DataAdapterType = 'server' | 'client' | 'http'
export type DataAdapterDescriptor<T extends DataAdapterType = 'server', TData = any> = {
    type: T;
    keyProperty?: keyof TData,
    displayProperty?: Key<TData>,
    valueProperty?: Key<TData>,
    imageProperty?: Key<TData>,
    options?: ProviderOptions<TData>
}
    & (T extends 'client' ? { data: Promise<TData[]> } : {})
    & (T extends 'http' ? { url: string, httpOptions?: HttpServerDataSourceOptions } : {})



export class Normalizer<S = any, N = any> {
    private _normalized$ = new ReplaySubject<N[]>(1)
    normalized$ = this._normalized$.asObservable()
    private _normalized: N[]

    get normalized(): N[] { return this._normalized }
    set normalized(v: N[]) {
        this._normalized = v
        this._normalized$.next(v)
    }


    private _src: S[]
    get src(): S[] { return this._src }
    normalize: (item: S) => N

    constructor(public readonly data$: Observable<any[]>) { }

    init(normalize: (item: S) => N) {
        this.normalize = normalize
        this._sub = this.data$.subscribe(data => {
            this._src = data
            this.normalized = this._normalize(data)
        })
    }

    _cache = new SmartMap<N>()
    protected _normalize(data: S[]): N[] {
        return data?.map(x => {
            let n = this._cache.get(x)
            if (!n) {
                n = this.normalize(x)
                this._cache.set(x, n)
            }
            return n
        })
    }

    private _sub: Subscription
    destroy() {
        this._sub.unsubscribe()
    }
}

export class DataAdapter<T = any> extends Normalizer<T, NormalizedItem<T>> {

    constructor(
        readonly dataSource: ITableDataSource<T>,
        readonly keyProperty?: keyof T, // what if ['item1','item2',...] then no need for key, display,value and img
        readonly displayProperty?: Key<T>,
        readonly valueProperty?: Key<T>,
        readonly imageProperty?: Key<T>,
        readonly options?: ProviderOptions<T>) {
        super(dataSource.data$)

        if (options) {
            if (options.page) this.dataSource.page = options.page
            else this.dataSource.page = { pageIndex: 0 }
            if (options.filter) this.dataSource.filter = options.filter
            if (options.sort) this.dataSource.sort = options.sort
            if (options.terms) this.dataSource.terms = options.terms
        }

        this.init(this._normalizeItem)
        this._sub2 = dataSource.data$.subscribe(() => this._allNormalized = null)
    }

    getKeysFromValue(value: Partial<T> | Partial<T>[]): (string | number | symbol)[] {
        if (!value) return []
        const v = Array.isArray(value) ? value : [value]
        return v.map(x => this.extract(x, this.keyProperty, x))
    }


    getItems(keys: (string | number | symbol) | (string | number | symbol)[]): Promise<NormalizedItem<T>[]> {
        //todo: What if keyProperty is undefined?
        if (!keys) return Promise.resolve([])

        const KEYS = Array.isArray(keys) ? keys : [keys]
        const itemsInAdapter = this.normalized?.filter(n => KEYS.some(k => k === n.key)) ?? []
        const itemsNotInAdapter = KEYS.filter(k => itemsInAdapter.every(n => n.key != k))

        const source = itemsNotInAdapter.length > 0 ?
            this.dataSource.getItems(itemsNotInAdapter, this.keyProperty)
                .pipe(
                    tap(items => console.log('items', items, this.dataSource)),
                    map(items => items.filter(x => x).map(i => this.normalize(i))),
                    map(items => items.concat(itemsInAdapter)),
                    map(x => KEYS.map(vi => x.find(ni => ni.key === vi))))
            : of(itemsInAdapter)

        return firstValueFrom(source)
    }



    _normalizeItem(item): NormalizedItem<T> {
        // if (this.groups) {
        //   for (let i = 0 i < this.groups.length i++) {
        //     const n = this._normalize(this.groups[i].items)
        //     normalized.push(...n)
        //   }
        // }

        const key = this.extract(item, this.keyProperty, item) ?? item

        const display = this.extract(item, this.displayProperty, item, true)
        let valueProperty = Array.isArray(this.valueProperty) ? [this.keyProperty, ...this.valueProperty] : [this.keyProperty, this.valueProperty]

        // if item is primitive type like string then no need to extract.
        let value = item as any
        const valueProps = [...new Set(valueProperty.filter((v, i) => v))]
        if (valueProps.length > 1) value = this.extract(item, valueProperty, item)
        else if (valueProps.length === 1) value = valueProps[0] ? item[valueProps[0]] : item //to handle keyProperty = null (take the item itself as a key)

        const image = this.extract(item, this.imageProperty, undefined)
        return { key, display, value, image, item }
    }



    extract(item: Partial<T>, property: Key<T>, fallback: Partial<T>, flatten = false) {
        if (property && item) {
            if (Array.isArray(property)) {
                if (property.length === 1) return this.__extract(item, property[0])
                const result: Partial<T> = {}
                property.forEach(k => result[k] = this.__extract(item, k as string))
                if (flatten) return Object.values(result).join(' ')
                else return result
            }
            else return this.__extract(item, property as string) ?? item
        }
        else return fallback
    }

    private __extract(item: any, property: any) {
        if (property.indexOf('.') > -1) return JsonPointer.get(item, property.replaceAll('.', '/'))
        else return item[property]
    }

    normalizeFilter(q: string) {

        const filter: FilterDescriptor = {}
        if (!q) {
            filter.terms = []
            return filter
        }
        const terms = q.split(' ').filter(x => x)
        terms.forEach(t => {
            if (t.indexOf(':') > 0) {
                const [key, value] = t.split(':')
                filter[key] = value
            } else {
                if (!filter.terms) filter.terms = []
                filter.terms.push(t)
            }
        })
        return filter
    }


    private _sub2: Subscription
    override destroy() {
        super.destroy()
        this._sub2.unsubscribe()
        if (this.dataSource.destroy) this.dataSource.destroy()
    }


    get page(): PageDescriptor { return this.dataSource.page }
    set page(page: PageDescriptor) { this.dataSource.page = page }

    get sort(): SortDescriptor { return this.dataSource.sort }
    set sort(sort: SortDescriptor) { this.dataSource.sort = sort }


    get filter(): FilterDescriptor { return this.dataSource.filter }
    set filter(filter: FilterDescriptor) { this.dataSource.filter = filter }


    _allNormalized: NormalizedItem<T>[]
    refresh() {
        if (this.dataSource.allDataLoaded) {
            if (!this._allNormalized) this._allNormalized = this.normalized
            const terms = this.options?.terms ?? []
            this.normalized = filterNormalized(this._allNormalized, this.filter, this.sort, this.page, terms.map(t => t.field))
        } else {
            this.dataSource.init({ page: this.page, sort: this.sort, filter: this.filter })
        }
    }

    public static fromKeys(keys: string[]): DataAdapter {
        return new DataAdapter(new ClientDataSource(keys))
    }
}

export class SmartMap<V> {
    _weak = new WeakMap<any, V>()
    _strong = new Map<object, V>()

    delete(key: any): boolean {
        const t = typeof key
        if (t === 'object') return this._weak.delete(key)
        else return this._strong.delete(key)
    }
    get(key: any): V | undefined {
        const t = typeof key
        if (t === 'object') return this._weak.get(key)
        else return this._strong.get(key)
    }
    has(key: any): boolean {
        const t = typeof key
        if (t === 'object') return this._weak.has(key)
        else return this._strong.has(key)
    }
    set(key: any, value: V) {
        const t = typeof key
        if (t === 'object') return this._weak.set(key, value)
        else return this._strong.set(key, value)
    }

}
