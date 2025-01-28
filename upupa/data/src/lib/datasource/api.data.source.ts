import { firstValueFrom } from "rxjs";
import { FilterDescriptor, PageDescriptor, ReadResult, SortDescriptor, TableDataSource, Term } from "./model";
import { ApiGetResult, DataService } from "../data.service";
import { Patch } from "@noah-ark/json-patch";
import { signal } from "@angular/core";

export class ApiDataSource<T = any> extends TableDataSource<T> {
    readonly allDataLoaded = signal(false);

    // readonly src$ = new ReplaySubject<Observable<T[]>>(1);
    // readonly data$ = this.src$.pipe(
    //     // debounceTime(200),
    //     switchMap((src) => src),
    // );

    private readonly url: URL;
    private get pathname() {
        return this.url ? this.url.pathname : this.path;
    }
    private get queryParams() {
        return this.url ? Object.fromEntries(this.url.searchParams as any) : {};
    }
    constructor(
        private readonly dataService: DataService,
        public readonly path: string,
    ) {
        super();
        const _url = new URL("/", dataService.api.api_base);
        this.url = new URL(path, _url.protocol + "//" + _url.host);
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

    load(options?: { page?: PageDescriptor; sort?: SortDescriptor; filter?: FilterDescriptor; terms?: Term<T>[] }): Promise<ReadResult<T>> {
        const filter = options?.filter ?? {};
        const search = filter.search;
        delete filter.search;

        const sort = options?.sort;
        const page = options?.page ?? { pageIndex: 0, pageSize: 25 };
        const terms = options?.terms ?? [];

        const query: any = { ...this.queryParams };
        if (search) {
            const termsFields = terms.slice();
            if (termsFields.length) {
                const k = termsFields.shift();
                const v = this._evalTerm(k, search);
                if (v) query[k.field] = v;
                if (termsFields.length)
                    query[k.field] +=
                        "|" +
                        termsFields
                            .map((f) => [String(f.field), this._evalTerm(f, search)])
                            .filter((f) => f[1] && `${f[1]}`.length > 0)
                            .map((f) => `${f[0]}=${f[1]}`)
                            .join("|");
            }
        }
        Object.keys(filter).forEach((k) => (query[k] = filter[k]));

        query.page = page && page.pageIndex ? Math.max(0, page.pageIndex) + 1 : 1;
        query.per_page = page && page.pageSize ? Math.max(0, page.pageSize) : 25;

        if (sort?.active) query.sort_by = `${sort.active},${sort.direction}`;

        // const src = this.getData(page, query);
        const data$ = this.dataService.get<T[]>(this.pathname, query);
        return firstValueFrom(data$).then((res:ApiGetResult<T[]>) => res as ReadResult<T>);
    }

    override create(value: Partial<T>) {
        return this.dataService.post(this.pathname, value);
    }

    override put(item: T, value: Partial<T>) {
        const key = item?.["_id"];
        if (key == undefined) throw new Error("Item has no _id key");
        return this.dataService.put(`${this.pathname}/${key}`, value);
    }

    override patch(item: T, patches: Patch[]) {
        const key = item?.["_id"];
        if (key == undefined) throw new Error("Item has no _id key");
        return this.dataService.patch(`${this.pathname}/${key}`, patches);
    }
    override delete(item: T) {
        const key = item?.["_id"];
        if (key == undefined) throw new Error("Item has no _id key");
        return this.dataService.delete(`${this.pathname}/${key}`);
    }

    destroy?() {}

    override getItems(keys: (string | number | symbol)[], key: string | number | symbol): Promise<T[]> {
        if (!keys?.length) return Promise.resolve([]);
        const query = { [key]: `{in}${keys.join(",")}` };
        return firstValueFrom(this.dataService.get<T[]>(this.pathname, query)).then((res) => res.data);
    }
}
