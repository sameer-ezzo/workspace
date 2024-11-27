import { ReplaySubject, Observable, of } from "rxjs";
import { catchError, debounceTime, map, switchMap, tap } from "rxjs/operators";
import { FilterDescriptor, PageDescriptor, SortDescriptor, TableDataSource, Term } from "./model";
import { PageEvent } from "@angular/material/paginator";
import { DataService } from "../data.service";
import { QueryDescriptor } from "../di.token";
import { Patch } from "@noah-ark/json-patch";
import { signal } from "@angular/core";

export class ApiDataSource<T = any> extends TableDataSource<T> {
    readonly allDataLoaded = signal(false);

    data: T[];
    readonly src$ = new ReplaySubject<Observable<T[]>>(1);
    readonly data$ = this.src$.pipe(
        // debounceTime(200),
        switchMap((src) => src),
    );

    constructor(
        private readonly dataService: DataService,
        public readonly path: string,
        private readonly selectedColumns: (keyof T)[],
    ) {
        super();
    }

    _evalTerm(term: Term<T>, value: string) {
        switch (term.type) {
            case "like":
                return `*${value}*`;
            case "number":
                return isNaN(+value) ? "" : +value;
            case "boolean":
                return value === "true";
            case "date":
                return new Date(value);
            default:
                return value;
        }
    }

    refresh(): Observable<T[]> {
        const filter = this.filter;
        const sort = this.sort;
        const page = this.page;

        const query: any = {};
        const term: any = filter && filter.terms?.length ? filter.terms.join(" ") : "";
        if (term) {
            const termsFields = this.terms.slice();
            if (termsFields.length) {
                const k = termsFields.shift();
                const v = this._evalTerm(k, term);
                if (v) query[k.field] = v;
                if (termsFields.length)
                    query[k.field] +=
                        "|" +
                        termsFields
                            .map((f) => [String(f.field), this._evalTerm(f, term)])
                            .filter((f) => f[1] && `${f[1]}`.length > 0)
                            .map((f) => `${f[0]}=${f[1]}`)
                            .join("|");
            }
        }
        Object.keys(filter ?? {}).forEach((k) => (query[k] = filter[k]));
        delete query.terms;

        query.page = page && page.pageIndex ? Math.max(0, page.pageIndex) + 1 : 1;
        query.per_page = page && page.pageSize ? Math.max(0, page.pageSize) : 25;

        if (sort?.active) query.sort_by = `${sort.active},${sort.direction}`;

        if (this.selectedColumns?.length > 0) query.select = this.selectedColumns.join(",");

        const src = this.getData(page, query);

        this.src$.next(src);
        return this.data$;
    }

    override async init(options?: { page?: PageDescriptor; sort?: SortDescriptor; filter?: FilterDescriptor }): Promise<void> {
        await this.dataService.refreshCache(this.path); // refresh api cache to get the latest data
        super.init(options);
    }

    getData(page: Partial<PageEvent>, query: QueryDescriptor): Observable<T[]> {
        return this.dataService.get<T[]>(this.path, query).pipe(
            catchError((error) =>
                of({
                    data: [],
                    total: 0,
                    error,
                }),
            ),
            tap((res) => {
                page.length = res.total;
                this.data = res.data as T[];
                this.allDataLoaded.set(this.data.length >= res.total);
            }),
            map((res) => res.data),
        );
    }

    override create(value: Partial<T>): Promise<unknown> {
        return this.dataService.post(this.path, value);
    }

    override put(item: T, value: Partial<T>): Promise<unknown> {
        const key = item?.["_id"];
        if (key == undefined) throw new Error("Item has no _id key");
        return this.dataService.put(`${this.path}/${key}`, value);
    }

    override patch(item: T, patches: Patch[]): Promise<unknown> {
        const key = item?.["_id"];
        if (key == undefined) throw new Error("Item has no _id key");
        return this.dataService.patch(`${this.path}/${key}`, patches);
    }
    override delete(item: T): Promise<void> {
        const key = item?.["_id"];
        if (key == undefined) throw new Error("Item has no _id key");
        return this.dataService.delete(`${this.path}/${key}`);
    }

    destroy?() {}

    override getItems(value: (string | number | symbol)[], key: string | number | symbol): Observable<T[]> {
        return value?.length > 0 ? this.getData({}, { [key]: `{in}${value.join(",")}` }) : of([]);
    }
}
