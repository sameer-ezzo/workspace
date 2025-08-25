import { Sort } from "@angular/material/sort";
import { PageEvent } from "@angular/material/paginator";
import { Patch } from "@noah-ark/json-patch";
import { WritableSignal } from "@angular/core";

export type PageDescriptor = Partial<PageEvent>;
export type SortDescriptor = Sort;

export type FilterDescriptor = Record<string, string | string[]> & { search?: string };

export declare type Dictionary<T = string> = Record<string, T>;

export declare type DataLoaderOptions<T> = {
    terms?: Term<T>[];
    page?: Partial<PageDescriptor>;
    sort?: SortDescriptor;
    filter?: Partial<FilterDescriptor>;
    autoRefresh?: boolean;
};

/**
 * This type is used to define the key of a type T.
 * It can be a single key of T or an array of keys of T.
 */
export type Key<T> = keyof T | (keyof T)[];
export type NormalizedItem<T = any> = {
    id: string;
    key: any;
    index?: number;
    item: T;
    display: Partial<T>;
    value: Partial<T>;
    image?: Partial<T>;
    defaultSearchTerm?: string;
    state: "loading" | "loaded" | "disabled" | "error";
    error: string | null;
    selected?: boolean;
};

export type Term<T> = { field: keyof T; type: "string" | "like" | "number" | "date" | "boolean" };

export type ReadResult<T = any> = {
    data: T[];
    total: number;
    query: any[];
};

export interface TableDataSource<T = any, WriteResult = any> {
    allDataLoaded: WritableSignal<boolean>;
    load(
        options?: { page?: PageDescriptor; sort?: SortDescriptor; filter?: FilterDescriptor; terms?: Term<T>[]; keys?: Key<T>[] },
        mapper?: (raw: unknown) => T[],
    ): Promise<ReadResult<T>>;
    create(value: Partial<T>): Promise<WriteResult>;
    put(item: T, value: Partial<T>): Promise<WriteResult>;
    patch(item: T, patches: Patch[]): Promise<WriteResult>;
    delete(item: T): Promise<WriteResult>;
}
