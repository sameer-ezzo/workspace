
import { Subscription } from "rxjs"
import { filter } from "rxjs/operators"
import { logger } from "../logger"
import { DefaultDeleteOptions, DefaultReadOptions, DefaultWriteOptions, DeleteOptions, ReadOptions, StoreAdapter, StoreName, WrappedItem, WriteOptions } from "./store.adapter"


export type MultiLayeredStoreOptions = {
    debug?: boolean
    readStrategy: 'race' | 'chain'
    writeStrategy: 'all' | 'first' | number[]
    deleteStrategy: 'all' | 'first' | number[]
}
const _storeOptions: MultiLayeredStoreOptions = { readStrategy: 'chain', writeStrategy: 'first', deleteStrategy: 'first' }

export type StoreResult<T> = { store: string, item: WrappedItem<T> }

export type MultiLayredReadOptions = ReadOptions & { autoUpsert?: boolean }
export const DefaultMultiLayredReadOptions: MultiLayredReadOptions = { ...DefaultReadOptions, autoUpsert: true }

export type PrefetchStrategy = {
    //when should a store prefetch a key?
    //should that key be updated/removed if updated/removed from src
    source: StoreName | number
    interval?: number


    //typically
    //fast should read some keys from mid and mid should read some keys from slow (so fast prefetches from mid immediately)
    //changes will be applied to fast and then propagated to mid and then to slow on intervals (mid prefetches from fast on intervals/events)
}

export type KeySyncOptions = { write: boolean, delete: boolean, expire: boolean }
export const DefaultKeySyncOptions: KeySyncOptions = { write: true, delete: true, expire: true }

export class MultiLayeredStore {

    readonly stores: { [name: string]: StoreAdapter } = Object.create(null)
    readonly prefetch: { [name: string]: PrefetchStrategy[] } = Object.create(null)
    readonly options: MultiLayeredStoreOptions

    constructor(stores: StoreAdapter[], options?: Partial<MultiLayeredStoreOptions>) {

        stores.forEach(store => this.stores[store.name] = store)
        Object.freeze(this.stores)
        Object.seal(this.stores)

        this.options = Object.assign({}, _storeOptions, options)
    }

    async GET<T>(key: string, options: Partial<MultiLayredReadOptions> = DefaultMultiLayredReadOptions): Promise<T> {
        const result = await this.FETCH(key, options)
        if (result?.store) {
            const store = this.stores[result.store]
            return store.unwrap(result.item as WrappedItem<T>)
        }
    }

    async FETCH<T>(key: string, options: Partial<MultiLayredReadOptions> = DefaultMultiLayredReadOptions): Promise<StoreResult<T>> {
        let result: StoreResult<T>
        switch (this.options.readStrategy) {
            case 'chain': result = await this._GET_BY_CHAIN<T>(key); break
            case 'race': result = await this._GET_BY_RACE<T>(key); break
            default:
                {
                    const s: never = this.options.readStrategy
                    throw new Error(`Unknown ${s} read strategy`)
                }
        }

        if (result && options.autoUpsert)
            this._upsert(key, result.item, result.store)

        return result
    }

    private async _upsert<T>(key: string, item: WrappedItem<T>, fromStore: string): Promise<boolean> {
        const _store = this.stores[fromStore]
        const _data = _store.unwrap(item)
        const _tasks: Promise<void>[] = []
        for (const k in this.stores) {
            if (k === fromStore) break //only write to stores that proceed the one returing the data
            const store = this.stores[k]
            const task = store.SET(key, _data) //dont await SET confirmations
                .then(result => { if (this.options.debug) logger.info(`[${store.name}] upserted ${key} : ${result}`) })
                .catch(error => { if (this.options.debug) logger.error(`[${store.name}] errored upserting ${key} : ${error}`) })
            _tasks.push(task)
        }
        return Promise.allSettled(_tasks).then(() => true)
    }

    private async _GET_BY_CHAIN<T>(key: string): Promise<StoreResult<T>> {
        for (const k in this.stores) {
            const store = this.stores[k]
            const result = await store.FETCH<T>(key)
            if (result != null) return { item: result, store: store.name }
        }
        return null
    }
    private _GET_BY_RACE<T>(key: string): Promise<StoreResult<T>> {
        return new Promise<StoreResult<T>>((resolve, reject) => {
            let resolved = 0
            const keys = Object.keys(this.stores)
            for (const k in keys) {
                const store = this.stores[k]
                store.FETCH<T>(key)
                    .then(result => {
                        if (!resolved) resolve({ item: result, store: store.name })
                        resolved++
                        if (resolved >= keys.length) resolve(null)
                    })
                    .catch(() => {
                        resolved++
                        if (resolved >= keys.length) resolve(null)
                    })
            }

        })
    }


    async SET<T>(key: string, value: T, options: WriteOptions = DefaultWriteOptions): Promise<string[]> {
        if (Array.isArray(this.options.writeStrategy)) return this._SET_SELECTED(this.options.writeStrategy, key, value, options)
        else {
            switch (this.options.writeStrategy) {
                case 'first': return this._SET_FIRST<T>(key, value, options)
                case 'all': return this._SET_ALL<T>(key, value, options)
                default:
                    {
                        const s: never = this.options.writeStrategy
                        throw new Error(`Unknown ${s} write strategy`)
                    }
            }
        }
    }

    private async _SET_FIRST<T>(key: string, value: T, options: WriteOptions): Promise<string[]> {
        const store = this.stores[0]
        const ok = await store.SET<T>(key, value, options)
        return ok ? [store.name] : null
    }

    private async _SET_ALL<T>(key: string, value: T, options: WriteOptions): Promise<string[]> {
        const tasks = Object.keys(this.stores).map(k => this.stores[k].SET<T>(key, value, options))
        const results = await Promise.allSettled(tasks)
        return results.filter(x => x.status === 'fulfilled').map((x: PromiseFulfilledResult<string>) => x.value)
    }

    private async _SET_SELECTED<T>(indexes: number[], key: string, value: T, options: WriteOptions): Promise<string[]> {
        const tasks = indexes.map(i => this.stores[i].SET(key, value, options))
        const results = await Promise.allSettled(tasks)
        return results.filter(x => x.status === 'fulfilled').map((x: PromiseFulfilledResult<string>) => x.value)
    }



    async DELETE(key: string, options: Partial<DeleteOptions> = DefaultDeleteOptions): Promise<string[]> {
        //delete strategies are DELETE_ALL, DELETE_FIRST, DELETE_SELECTED
        options = { ...DefaultDeleteOptions, ...options }
        if (Array.isArray(this.options.deleteStrategy)) return this._DELETE_SELECTED(this.options.deleteStrategy, key, options)
        else {
            switch (this.options.deleteStrategy) {
                case 'first': return this._DELETE_FIRST(key, options)
                case 'all': return this._DELETE_ALL(key, options)
                default:
                    {
                        const s: never = this.options.deleteStrategy
                        throw new Error(`Unknown ${s} delete strategy`)
                    }
            }
        }
    }

    private async _DELETE_ALL(key: string, options: Partial<DeleteOptions>): Promise<string[]> {
        const tasks = Object.keys(this.stores).map(k => this.stores[k].DELETE(key, options))
        const results = await Promise.allSettled(tasks)
        return results.filter(x => x.status === 'fulfilled').map((x: PromiseFulfilledResult<string>) => x.value)
    }

    private async _DELETE_FIRST(key: string, options: Partial<DeleteOptions>): Promise<string[]> {
        const store = this.stores[0]
        const ok = await store.DELETE(key, options)
        return ok ? [store.name] : null
    }

    private async _DELETE_SELECTED(indexes: number[], key: string, options: Partial<DeleteOptions>): Promise<string[]> {
        const tasks = indexes.map(i => this.stores[i].DELETE(key, options))
        const results = await Promise.allSettled(tasks)
        return results.filter(x => x.status === 'fulfilled').map((x: PromiseFulfilledResult<string>) => x.value)
    }


    /**
     * Moves an item from one store to another
     * @param key The key of the item to move
     * @param fromStore The name of the store to move from. 
     * @param toStore The name of the store to move to.If passed as number it will be used as the relative index indistance from the source store. @example if you have a store named 'store1' and you pass 1, the item will be moved from 'store1' to the next 'store2'
     * @returns StoreResult
     */
    async MIGRATE<T = unknown>(key: string, fromStore: StoreName, toStore: StoreName | number): Promise<StoreResult<T>> {
        const from = this.stores[fromStore]
        if (!from) throw new Error(`Store ${fromStore} not found`)

        const keys = Object.keys(this.stores)
        toStore = (Number.isFinite(toStore) ? keys[keys.indexOf(fromStore) + +toStore] : toStore) as StoreName
        const to = this.stores[toStore]
        if (!to) throw new Error(`Store ${toStore} not found`)

        const data = await from.FETCH<T>(key)
        if (data === null) return undefined

        const ok = await to.SET(key, data)
        if (ok) {
            await from.DELETE(key)
            return { item: data, store: toStore }
        }
    }


    readonly tracking: Record<string, Subscription[]> = {}

    /**
     * Automatically subscribe to changes in a store and progpagate them to another one.
     * @param key The data key to be tracked
     * @param fromStore The store to be watched for changes
     * @param toStore The name of the store to move to.If passed as number it will be used as the relative index indistance from the source store. @example if you have a store named 'store1' and you pass 1, the item will be moved from 'store1' to the next 'store2'
     * @returns trackingKey of the template `${fromStore}-${toStore}-${key}` 
     */
    track(key: string, fromStore: StoreName, toStore: StoreName | number, options: Partial<KeySyncOptions> = DefaultKeySyncOptions): string {
        options = { ...DefaultKeySyncOptions, ...options }
        const from = this.stores[fromStore]
        if (!from) throw new Error(`Store ${fromStore} not found`)

        const keys = Object.keys(this.stores)
        toStore = (Number.isFinite(toStore) ? keys[keys.indexOf(fromStore) + +toStore] : toStore) as StoreName
        const to = this.stores[toStore]
        if (!to) throw new Error(`Store ${toStore} not found`)


        const s: Subscription[] = []

        if (options.write) {
            s[s.length] = from.on('WRITE')
                .pipe(
                    filter(e => e.key === key),
                    filter(e => !e.src.some(s => s === to.name)) //prevent infinite loop if the change was caused initially by this store
                )
                .subscribe(x => { to.SET(x.key, x.value, { eventSource: [...x.src, from.name] }) })
        }
        if (options.delete) {
            s[s.length] = from.on('DELETE')
                .pipe(filter(e => e.key === key), filter(e => !e.src.some(s => s === to.name)))
                .subscribe(x => { to.DELETE(x.key, { eventSource: [...x.src, from.name] }) })
        }
        if (options.expire) {
            s[s.length] = from.on('EXPIRE')
                .pipe(filter(e => e.key === key), filter(e => !e.src.some(s => s === to.name)))
                .subscribe(x => { to.DELETE(x.key, { eventSource: [...x.src, from.name] }) })
        }

        const trackingKey = `${fromStore}-${toStore}-${key}`
        this.tracking[trackingKey] = s
        return trackingKey
    }

    /**
     * 
     * @param trackingKey Stop tracking a key. The tacking key goes by the template `${fromStore}-${toStore}-${key}`
     */
    untrack(trackingKey: string) {
        const s = this.tracking[trackingKey]
        if (s) {
            s.forEach(x => x?.unsubscribe())
            delete this.tracking[trackingKey]
        }
    }

    /**
     * 
     there is also a strategy so when a store prefetch items from other stores,
     also keep on read (ex: fill up memory from redis based on hits or last hit)
    
     
    
     monitor events (on replaced, on deleted, on expired, on created, on read)
     is upsert the same as prefetch ? 
     ex: if lower store has on replaced event then higher stores should prefetch it => some commands should not cause events to be raised
     prefetching is not the same as data sync, the latter means for example a redis store can fire an event telling other redis stores to update their data on a specifiic channel (that's why name is important)

     what about throttle upserting ?
     */

}


