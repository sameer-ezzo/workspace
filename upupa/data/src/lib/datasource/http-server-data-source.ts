import { ReplaySubject, Observable, of, Subject } from "rxjs";
import { debounceTime, map, shareReplay, switchMap, takeUntil } from "rxjs/operators";
import { FilterDescriptor, TableDataSource, Term } from "./model";
import { HttpClient, HttpContext, HttpHeaders, HttpParams } from "@angular/common/http";
import { Patch } from "@noah-ark/json-patch";

export type HttpServerDataSourceOptions = {
    headers?:
        | HttpHeaders
        | {
              [header: string]: string | string[];
          };
    context?: HttpContext;
    observe?: "body";
    params?:
        | HttpParams
        | {
              [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean>;
          };
    reportProgress?: boolean;
    responseType?: "json";
    withCredentials?: boolean;
};

export class HttpServerDataSource<T = any> extends TableDataSource<T> {
    create(value: Partial<T>): Promise<unknown> {
        throw new Error("Method not implemented.");
    }
    put(item: T, value: Partial<T>): Promise<unknown> {
        throw new Error("Method not implemented.");
    }
    patch(item: T, patches: Patch[]): Promise<unknown> {
        throw new Error("Method not implemented.");
    }
    delete(item: T): Promise<unknown> {
        throw new Error("Method not implemented.");
    }
    data: T[];

    readonly allDataLoaded = false;


    readonly src$ = new ReplaySubject<Observable<T[]>>(1);
    readonly data$ = this.src$.pipe(switchMap((src) => src));

    constructor(
        private readonly http: HttpClient,
        private readonly url: string,
        private readonly httpOptions: HttpServerDataSourceOptions | null = null,
        private readonly resToData: (res: any) => T[] = (res) => res,
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
                if (termsFields.length) query[k.field] += "|" + termsFields.map((f) => `${String(f.field)}=${this._evalTerm(f, term)}`).join("|");
            }
        }
        Object.keys(filter).forEach((k) => (query[k] = filter[k]));
        delete query.terms;

        query.page = page && page.pageIndex ? Math.max(0, page.pageIndex) + 1 : 1;
        query.per_page = page && page.pageSize ? Math.max(0, page.pageSize) : 25;

        if (sort?.active) query.sort_by = `${sort.active},${sort.direction}`;

        const { select } = this.filter;
        query.select = select?.length > 0 ? select : undefined;

        const src = this.doRequest(query);
        this.src$.next(src);

        return this.data$;
    }

    private doRequest(params: any) {
        const qps = Object.entries({ ...this.filter, ...params })
            .map(([k, v]) => `${k}=${v}`)
            .join("&");
        const url = [this.url, qps].join("?");
        return this.http.get<T[]>(url, this.httpOptions ?? {}).pipe(shareReplay(1), map(this.resToData));
    }

    override getItems(value: (string | number | symbol)[], key: string | number | symbol): Observable<T[]> {
        return value?.length > 0 ? this.doRequest({ [key]: `{in}${value.join(",")}` }) : of([]);
    }

    destroy?() { }
}
