import { interval, Observable, Subject } from "rxjs"
import { filter } from "rxjs/operators"
import { logger } from "../logger"

import { DefaultDeleteOptions, DefaultReadOptions, DefaultWriteOptions, DeleteOptions, ReadOptions, StoreAdapter, StoreEvent, StoreEventArgs, StoreName, WrappedItem, WrappedItemOptions, WriteOptions } from "./store.adapter"


export type StoreOptions = {
    debug?: boolean
    markAsColdAfter: number
    garbageCollectionInterval: number
    aggresiveThresholdPerItems: number // aggresive level = aggresiveThreshold / itemsCount
}
export const DefaultStoreOptions: StoreOptions = {
    markAsColdAfter: 1000 * 60 * 20, // 20 minutes
    garbageCollectionInterval: 1000 * 60, // 1 minutes
    aggresiveThresholdPerItems: 5000
}

export class MemoryStore implements StoreAdapter {

    _store: { [key: string]: WrappedItem } = Object.create(null)
    _interval: unknown

    readonly options: StoreOptions
    constructor(public name: StoreName, options: Partial<StoreOptions> = DefaultStoreOptions) {
        this.options = { ...DefaultStoreOptions, ...options }
        // init background interval for garbage collection

        if (options.debug) logger.info(`[${name}] init background interval for garbage collection with interval ${this.options.garbageCollectionInterval}`)
        // this._interval = setInterval(() => this.collectGarbage(), options.garbageCollectionInterval)
        interval(this.options.garbageCollectionInterval).subscribe(() => this.GC())
    }




    wrap<T>(obj: T, options?: Partial<WrappedItemOptions>): WrappedItem<T> {
        //error if bothe expireAt and expireAfter are set
        if (options?._expireAt != null && options?._expireSpan != null) throw new Error('_expireAt and _expireSpan are mutually exclusive')

        let _expireAt = options?._expireSpan ? Date.now() + options._expireSpan : undefined
        _expireAt ??= options?._expireAt
        const _default = { _expireAt, _hits: 1, _lastHit: Date.now() }
        return { ..._default, ...options, ...{ _data: obj } }
    }
    unwrap<T>(obj: WrappedItem<T>): T { return obj?._data }

    private _event$ = new Subject<StoreEventArgs>()
    on(event: StoreEvent): Observable<StoreEventArgs> {
        return this._event$.pipe(filter(e => e.event === event))
    }
    private _emit<T>(event: StoreEvent, args: { key: string, value?: T, src: string[] }): void {
        this._event$.next({ ...args, event, src: args.src ? [...args.src, this.name] : [this.name] })
    }

    FETCH<T>(key: string, options: Partial<ReadOptions> = DefaultReadOptions): Promise<WrappedItem<T>> {
        options = { ...DefaultReadOptions, ...options }

        const item = this._store[key] as WrappedItem<T>

        if (item && options.emitEvent) {
            this._hit(key, item)
            const value = this.unwrap(item)
            this._emit('READ', { key, value, src: options.eventSource })
        }
        if (item && options.expire) {
            if (Number.isFinite(options.expire)) item._expireSpan = +options.expire
            this._store[key] = this._slide(key, item)
        }
        return Promise.resolve(this._store[key] as WrappedItem<T>)
    }
    async GET<T>(key: string, options: Partial<ReadOptions> = DefaultReadOptions): Promise<T> {
        const wrappedItem = await this.FETCH(key, options)
        return wrappedItem ? this.unwrap(wrappedItem) as T : undefined
    }

    private _hit(key: string, item: WrappedItem) {
        if (!item) return

        item._hits++
        item._lastHit = Date.now()
        this._store[key] = item
    }

    private _slide<T>(key: string, item: WrappedItem<T>): WrappedItem<T> {
        item._expireAt = Date.now() + item._expireSpan
        return item
    }

    SET<T>(key: string, value: T, options: Partial<WriteOptions> = DefaultWriteOptions): Promise<StoreName> {
        if (value === null) throw new Error('value cannot be null')

        options = { ...DefaultWriteOptions, ...options }
        const item = this.wrap(value, { _expireSpan: options?.expire })

        return this.PUT(key, item, options)
    }

    PUT<T>(key: string, item: WrappedItem<T>, options?: Partial<WriteOptions>): Promise<string> {
        if (item === null) throw new Error('value cannot be null')

        options = { ...DefaultWriteOptions, ...options }

        this._store[key] = item
        if (options.emitEvent) {
            this._emit('WRITE', { key, value: item._data, src: options.eventSource })
        }
        return Promise.resolve(this.name)
    }

    DELETE(key: string, options: Partial<DeleteOptions> = DefaultDeleteOptions): Promise<StoreName> {
        options = { ...DefaultDeleteOptions, ...options }

        delete this._store[key]
        if (options.emitEvent) {
            this._emit('DELETE', { key, src: options.eventSource })
        }
        return Promise.resolve(this.name)
    }

    GC(aggressive?: number) {
        if (this.options.debug) logger.info(`[${this.name}] garbage collection started`);

        aggressive ??= Math.floor(Object.keys(this._store).length / this.options.aggresiveThresholdPerItems)
        const threshold = this.options.markAsColdAfter * aggressive

        const now = Date.now()

        for (const key in this._store) {
            const item = this._store[key] as WrappedItem
            let shouldDelete = item._expireAt && item._expireAt < now //is expired
            if (!shouldDelete) shouldDelete = aggressive > 0 && item._lastHit < (now - threshold)

            if (shouldDelete) {
                delete this._store[key]
                this._emit('EXPIRE', { key, src: ['GC'] })
            }
        }
    }

}
