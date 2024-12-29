import { firstValueFrom } from "rxjs";
import { FilterDescriptor, PageDescriptor, SortDescriptor, TableDataSource, Term } from "./model";
import { DataService } from "../data.service";
import { Patch } from "@noah-ark/json-patch";
import { signal } from "@angular/core";

export class ApiDataSource<T = any> extends TableDataSource<T> {
    readonly allDataLoaded = signal(false);

    // readonly src$ = new ReplaySubject<Observable<T[]>>(1);
    // readonly data$ = this.src$.pipe(
    //     // debounceTime(200),
    //     switchMap((src) => src),
    // );

    constructor(
        private readonly dataService: DataService,
        public readonly path: string,
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

    load(options?: { page?: PageDescriptor; sort?: SortDescriptor; filter?: FilterDescriptor; terms?: Term<T>[] }): Promise<T[]> {
        const filter = options?.filter ?? {};
        const search = filter.search;
        delete filter.search;

        const sort = options?.sort;
        const page = options?.page ?? { pageIndex: 0, pageSize: 25 };
        const terms = options?.terms ?? [];

        const query: any = {};
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
        const data$ = this.dataService.get<T[]>(this.path, query);
        return firstValueFrom(data$).then((res) => res.data);
    }

    // getData(page: Partial<PageEvent>, query: QueryDescriptor): Promise<T[]> {
    // return this.dataService.get<T[]>(this.path, query).pipe(
    //     catchError((error) =>
    //         of({
    //             data: [],
    //             total: 0,
    //             error,
    //         }),
    //     ),
    //     tap((res) => {
    //         page.length = res.total;
    //         this.data = res.data as T[];
    //         this.allDataLoaded.set(this.data.length >= res.total);
    //     }),
    //     map((res) => res.data),
    // );
    // }

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

    override getItems(keys: (string | number | symbol)[], key: string | number | symbol): Promise<T[]> {
        if (!keys?.length) return Promise.resolve([]);
        const query = { [key]: `{in}${keys.join(",")}` };
        return firstValueFrom(this.dataService.get<T[]>(this.path, query)).then((res) => res.data);
    }
}
