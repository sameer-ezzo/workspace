import { from, merge, Observable, of, ReplaySubject } from "rxjs";
import { PageDescriptor, SortDescriptor, TableDataSource, FilterDescriptor } from "./model";
import { filter } from "./filter.fun";

import { debounceTime, switchMap, map, tap, shareReplay } from "rxjs/operators";

export function getByPath(obj: any, path: string) {
    const segments = path.split(".");
    let result = obj;
    while (segments.length) {
        const s = segments.shift();
        result = result[s];
    }
    return result;
}

export function compare(a, b): number {
    if (a?.localeCompare) return a.localeCompare(b);
    if (a > b) return 1;
    else if (a < b) return -1;
    else return 0;
}

export class ClientDataSource<T = any> extends TableDataSource<T> {
    readonly allDataLoaded = true;
    private _all: T[];
    public get all(): T[] {
        return this._all;
    }
    public set all(v: T[]) {
        this._all = v;
        this.src$.next(of(v));
    }

    data: T[];
    readonly src$ = new ReplaySubject<Observable<T[]>>(1);
    private readonly _all$ = new ReplaySubject<T[]>(1);
    readonly data$ = merge(this._all$, this.src$.pipe(switchMap((src) => src))).pipe(
        tap((x) => (this._all = x)),
        map((all) => filter(all, this.filter, this.sort, this.page, this.terms)),
        shareReplay(1),
    ); //everytime the src is changed switch to the new one

    //
    constructor(_all: readonly T[] | T[] | Promise<T[]> | Observable<T[]>, options?: { page?: PageDescriptor; sort?: SortDescriptor; filter?: FilterDescriptor }) {
        super();
        this.init(options);
        if (_all instanceof Observable) this.src$.next(_all);
        else if (_all instanceof Promise) this.src$.next(from(_all));
        else this.src$.next(of(_all as T[]));
    }

    refresh(options?: { page?: PageDescriptor; sort?: SortDescriptor; filter?: FilterDescriptor }): Observable<T[]> {
        if (options) {
            this._initialized = false;
            if (options.page) this.page = options.page;
            if (options.sort) this.sort = options.sort;
            if (options.filter) this.filter = options.filter;
            this._initialized = true;
        }

        //const data = filter(this.all, this.filter, this.sort, this.page, this.terms)
        this._all$.next(this._all);
        return this.data$;
    }

    destroy?() {}

    override getItems(keys: (string | number | symbol)[], keyProperty: string): Observable<T[]> {
        return keys?.length > 0
            ? this._all$.pipe(
                  map((all) => {
                      if (!all || all.length === 0) return keys;
                      else return keys.map((k) => all.find((item) => k === item?.[keyProperty]));
                  }),
              )
            : of([]);
    }
}
