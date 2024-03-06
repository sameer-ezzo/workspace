import { Observable } from "rxjs";

export type WriteOptions = { emitEvent: boolean, expire?: number, eventSource?: string[] }
export const DefaultWriteOptions: WriteOptions = { emitEvent: true }

export type ReadOptions = { emitEvent: boolean, expire?: number | 'slide', eventSource?: string[] }
export const DefaultReadOptions: ReadOptions = { emitEvent: true, expire: 'slide' }

export type DeleteOptions = { emitEvent: boolean, eventSource?: string[] }
export const DefaultDeleteOptions: DeleteOptions = { emitEvent: true }

export const STORE_EVENTS = ['READ', 'WRITE', 'EXPIRE', 'DELETE'] as const
export type StoreEvent = typeof STORE_EVENTS[number]
export type StoreEventArgs<T = unknown> = { event: StoreEvent, key: string, src: string[], value?: T }


export type WrappedItemOptions = { _hits: number, _lastHit: number, _expireSpan?: number, _expireAt?: number }
export type WrappedItem<T = unknown> = WrappedItemOptions & { _data: T }

export type StoreName = string

export type StoreAdapter = {

    name: StoreName;
    wrap<T>(obj: T, options?: WrappedItemOptions): WrappedItem<T>;
    unwrap<T>(obj: WrappedItem<T>): T;
    on(event: StoreEvent): Observable<StoreEventArgs>;


    GET<T>(key: string, options?: Partial<ReadOptions>): Promise<T>;
    FETCH<T>(key: string, options?: Partial<ReadOptions>): Promise<WrappedItem<T>>;

    SET<T>(key: string, value: T, options?: Partial<WriteOptions>): Promise<StoreName>;
    PUT<T>(key: string, value: WrappedItem<T>, options?: Partial<WriteOptions>): Promise<StoreName>;

    DELETE(key: string, options?: Partial<DeleteOptions>): Promise<StoreName>;

};




