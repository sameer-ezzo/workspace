import { Sort } from "@angular/material/sort";
import { PageEvent } from "@angular/material/paginator";
import { Observable, of } from "rxjs";
import { BehaviorSubject } from "rxjs";
import { Patch } from "@noah-ark/json-patch";

export type PageDescriptor = Partial<PageEvent>;
export type SortDescriptor = Sort;

export type FilterDescriptor = Record<string, string | string[]> & { terms?: string[] };

export declare type Dictionary<T = string> = Record<string, T>;
export declare type ProviderOptions<T> = {
    terms?: Term<T>[];
    page?: Partial<PageDescriptor>;
    sort?: SortDescriptor;
    filter?: Partial<FilterDescriptor>;
};
export interface ITableDataSource<T = any> {
    data: T[]; //normalized,
    readonly data$: Observable<T[]>;
    refresh(options?: { page?: PageDescriptor; sort?: SortDescriptor; filter?: FilterDescriptor }): Observable<T[]>;
    destroy?();
    readonly allDataLoaded: boolean; //so (filter/sort/group from client-side) true? false?

    init(options?: { page?: PageDescriptor; sort?: SortDescriptor; filter?: FilterDescriptor });
    page: PageDescriptor;
    sort: SortDescriptor;
    filter: FilterDescriptor;
    terms: Term<T>[];
    getItems(keys: (string | number | symbol)[], keyProperty: string | number | symbol): Observable<T[]>;

    create(value: Partial<T>): Promise<unknown>;
    put(item: T, value: Partial<T>): Promise<unknown>;
    patch(item: T, patches: Patch[]): Promise<unknown>;
    delete(item: T): Promise<unknown>;
}

/**
 * This type is used to define the key of a type T.
 * It can be a single key of T or an array of keys of T.
 */
export type Key<T> = keyof T | (keyof T)[];
export type NormalizedItem<T = any> = { key: any; item: T; display: Partial<T>; value: Partial<T>; image?: Partial<T>; defaultSearchTerm?: string };

export type Term<T> = { field: keyof T; type: "string" | "like" | "number" | "date" | "boolean" };

export abstract class TableDataSource<T = any> implements ITableDataSource<T> {
    // todo: implement all CRUD operations
    create(value: Partial<T>): Promise<unknown> {
        return Promise.resolve(value);
    }
    put(item: T, value: Partial<T>): Promise<unknown> {
        return Promise.resolve(value);
    }
    patch(item: T, patches: Patch[]): Promise<unknown> {
        return Promise.resolve(item);
    }
    delete(item: T): Promise<unknown> {
        return Promise.resolve(item);
    }

    abstract readonly data: T[];
    abstract readonly data$: Observable<T[]>;
    abstract readonly allDataLoaded: boolean;

    abstract refresh(options?: { page?: PageDescriptor; sort?: SortDescriptor; filter?: FilterDescriptor });
    abstract destroy?();

    protected _initialized = false;

    readonly page$: BehaviorSubject<PageDescriptor> = new BehaviorSubject<PageDescriptor>({ pageIndex: 0 });
    get page(): PageDescriptor {
        return this.page$.value;
    }
    set page(page: PageDescriptor) {
        this.page$.next(page);
        if (this._initialized) this.refresh();
    }

    readonly sort$: BehaviorSubject<SortDescriptor> = new BehaviorSubject<SortDescriptor>(null);
    get sort(): SortDescriptor {
        return this.sort$.value;
    }
    set sort(sort: SortDescriptor) {
        this.sort$.next(sort);
        if (this._initialized) this.refresh();
    }

    readonly filter$: BehaviorSubject<FilterDescriptor> = new BehaviorSubject<FilterDescriptor>({});
    get filter(): FilterDescriptor {
        return this.filter$.value;
    }
    set filter(filter: FilterDescriptor) {
        this.filter$.next(filter);
        this.page.pageIndex = 0;
        if (this._initialized) this.refresh();
    }

    readonly terms$: BehaviorSubject<Term<T>[]> = new BehaviorSubject<Term<T>[]>([]);
    get terms(): Term<T>[] {
        return this.terms$.value;
    }
    set terms(terms: Term<T>[]) {
        this.terms$.next(terms);
        if (this._initialized) this.refresh();
    }

    init(options?: { page?: PageDescriptor; sort?: SortDescriptor; filter?: FilterDescriptor }) {
        this._initialized = true;
        this.refresh(options);
    }

    getItems(value: (string | number | symbol)[], key: string | number | symbol): Observable<T[]> {
        return of([]);
    }
}
