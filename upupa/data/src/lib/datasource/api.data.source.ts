import { firstValueFrom, map } from "rxjs";
import { FilterDescriptor, Key, PageDescriptor, ReadResult, SortDescriptor, TableDataSource, Term } from "./model";
import { ApiGetResult, DataService } from "../data.service";
import { Patch } from "@noah-ark/json-patch";
import { signal } from "@angular/core";

export class ApiDataSource<T extends { _id?: unknown } = any> implements TableDataSource<T> {
    readonly allDataLoaded = signal(false);

    private _url: URL;
    get url(): URL {
        return this._url;
    }
    private set url(value: URL) {
        this._url = value;
    }
    private get pathname() {
        return this.url ? this.url.pathname : this.path;
    }
    private get queryParams(): Record<string, string> {
        return this.url ? Object.fromEntries(this.url.searchParams as any) : {};
    }
    constructor(
        private readonly dataService: DataService,
        readonly path: string,
        readonly key: keyof T = "_id",
    ) {
        this._initUrl();
    }
    private async _initUrl() {
        const apiBase = await this.dataService.api.api_base_Promise;
        const _url = new URL("/", apiBase);
        this.url = new URL(this.path, _url.protocol + "//" + _url.host);
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

    load(
        options?: { page?: PageDescriptor; sort?: SortDescriptor; filter?: FilterDescriptor; terms?: Term<T>[]; keys?: Key<T>[] },
        mapper?: (raw: unknown) => T[],
    ): Promise<ReadResult<T>> {
        const filter = options?.filter ?? {};
        const search = filter.search;
        delete filter.search;

        const sort = options?.sort;
        const page = options?.page ?? { pageIndex: 0, pageSize: 25 };
        const terms = (options?.terms ?? []).slice();

        const query: Record<string | "page" | "per_page", string | number> = options?.keys?.length
            ? { [this.key]: `{in}${options.keys.join(",")}`, per_page: options.keys.length }
            : { ...this.queryParams };
        if (!options?.keys?.length) {
            // when passing keys we want to make sure items are returned
            if (search && terms.length) {
                const r = terms.map((f) => [String(f.field), this._evalTerm(f, search)]);
                const t = r.filter((f) => f[1] && `${f[1]}`.length > 0) as [string, string][];
                const [k, v] = t.shift();
                const rest = t.map((f) => `${f[0]}=${f[1]}`).join("|");
                query[k] = v + (t.length === 0 ? "" : `|` + rest);
            }
            Object.keys(filter).forEach((k) => (query[k] = filter[k] as string));

            query["page"] = page && page.pageIndex ? Math.max(0, page.pageIndex) + 1 : 1;
            query["per_page"] = page && page.pageSize ? Math.max(0, page.pageSize) : 25;
        }

        if (sort?.active) query["sort_by"] = `${sort.active},${sort.direction}`;

        const data$ = this.dataService.get<T[]>(this.pathname, query).pipe(map((res) => ({ ...res, data: mapper ? mapper(res.data ?? []) : res.data })));
        return firstValueFrom(data$).then((res: ApiGetResult<T[]>) => res as ReadResult<T>);
    }

    async create(value: Partial<T>) {
        const { document } = await this.dataService.post(this.pathname, value);
        return document as T;
    }

    async put(item: T, value: Partial<T>) {
        const key = item?.[this.key];
        if (key == undefined) throw new Error("Item has no key");
        const document = await this.dataService.put(`${this.pathname}/${key}`, value);
        return document as T;
    }

    patch(item: T, patches: Patch[]) {
        const key = item?.[this.key];
        if (key == undefined) throw new Error("Item has no key");
        return this.dataService.patch(`${this.pathname}/${key}`, patches);
    }
    delete(item: T) {
        const key = item?.[this.key];
        if (key == undefined) throw new Error("Item has no key");
        return this.dataService.delete(`${this.pathname}/${key}`);
    }

    destroy?() {}

    //  getItems(keys: (string | number | symbol)[], key: string | number | symbol): Promise<T[]> {
    //     if (!keys?.length) return Promise.resolve([]);
    //     const query = { [key]: `{in}${keys.join(",")}` };
    //     return firstValueFrom(this.dataService.get<T[]>(this.pathname, query)).then((res) => res.data);
    // }
}
