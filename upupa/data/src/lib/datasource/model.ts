import { Sort } from "@angular/material/sort";
import { PageEvent } from "@angular/material/paginator";
import { Patch } from "@noah-ark/json-patch";
import { signalStore, withState } from "@ngrx/signals";

export type PageDescriptor = Partial<PageEvent>;
export type SortDescriptor = Sort;

export type FilterDescriptor = Record<string, string | string[]> & { search?: string };

export declare type Dictionary<T = string> = Record<string, T>;
export declare type DataLoaderOptions<T> = {
    terms?: Term<T>[];
    page?: Partial<PageDescriptor>;
    sort?: SortDescriptor;
    filter?: Partial<FilterDescriptor>;
};

/**
 * This type is used to define the key of a type T.
 * It can be a single key of T or an array of keys of T.
 */
export type Key<T> = keyof T | (keyof T)[];
export type NormalizedItem<T = any> = { key: any; item: T; display: Partial<T>; value: Partial<T>; image?: Partial<T>; defaultSearchTerm?: string };

export type Term<T> = { field: keyof T; type: "string" | "like" | "number" | "date" | "boolean" };

export abstract class TableDataSource<T = any> {
    abstract load(options?: { page?: PageDescriptor; sort?: SortDescriptor; filter?: FilterDescriptor; terms?: Term<T>[] }): Promise<T[]>;
    abstract getItems(value: (string | number | symbol)[], key: string | number | symbol): Promise<T[]>;
    abstract create<R = unknown>(value: Partial<T>): Promise<unknown>;
    abstract put<R = unknown>(item: T, value: Partial<T>): Promise<unknown>;
    abstract patch<R = unknown>(item: T, patches: Patch[]): Promise<unknown>;
    abstract delete<R = unknown>(item: T): Promise<unknown>;
}
