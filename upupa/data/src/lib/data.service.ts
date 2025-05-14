import { map, multicast, refCount, startWith } from "rxjs/operators";
import { afterNextRender, Injectable } from "@angular/core";
import { Observable, ReplaySubject, interval, NEVER, combineLatest, firstValueFrom } from "rxjs";
import { LocalService } from "./local.service";
import { DataResult, DataConfig } from "./model";
import { DataSyncService } from "./sync.service";
import { ApiService } from "./api.service";
import { CacheStore } from "./cache.store";
import { QueryDescriptor, MetaDataDescriptor } from "./di.token";
import { Patch } from "@noah-ark/json-patch";

const prefixPath = (path: string) => ((path = path.trim()).startsWith("/") ? path : `/${path}`);

export class DataListener {
    headers: any;
    subject: ReplaySubject<any>;
    stream: Observable<any>;
}

export type ApiGetResult<T> = { data: T; total: number; query: any[] };

@Injectable({ providedIn: "root" })
export class DataService {
    private local: LocalService;
    private sync: DataSyncService;
    private config: DataConfig;

    //private subjects = new CacheStore();
    //private streams = new CacheStore();
    //private h = new CacheStore();

    private readonly cache = new CacheStore<DataListener>();

    constructor(public readonly api: ApiService) {
        afterNextRender(() => {
            interval(10000).subscribe(() => this.recycleCache());
        });
    }

    //the path contains the filtering, sorting, page and selection
    //so different page means different path => different data
    fetch<T>(path: string, query?: QueryDescriptor, headers?: MetaDataDescriptor): Observable<DataResult<T>> {
        //convert query obj to query string and append it to path
        path = prefixPath(path);
        if (query) {
            const qs = Object.keys(query)
                .map((k) => `${k}=${query[k]}`)
                .join("&");
            if (path.indexOf("?") > -1) path = path + "&" + qs;
            else path = path + "?" + qs;
        }

        const x = this.cache.get(path);
        this.cache.refresh(path);
        // init stream
        if (!x) {
            //casted observable to be triggered later
            const subject = new ReplaySubject<DataResult<T>>(1);

            //api source
            const api$ = this.api.fetch<T>(path, headers).pipe(
                map((res) => {
                    const meta: { [key: string]: string } = {};
                    const keys = res.headers.keys().filter((k) => k.toLowerCase().startsWith("x-get-"));
                    keys.forEach((k) => (meta[k.substring(6)] = res.headers.get(k)));
                    return {
                        data: res.body,
                        meta: keys.length ? meta : undefined,
                        source: { type: "api" },
                    } as DataResult;
                }),
            );

            //NEVER.pipe(startWith): to create a stream that only emits 1 and never complete
            //multicast: share to prevent subscribers to activate api call with each subscription
            const stream = combineLatest([api$, NEVER.pipe(startWith(1))]).pipe(
                map(([apiResult]) => apiResult),
                multicast(subject),
                refCount(),
            );

            // const stream = new Observable<DataResult<T>>((observer) => {
            //     try {
            //         firstValueFrom(api$)
            //             .then((x) => observer.next(x))
            //             .catch((e) => observer.error(e));
            //     } catch (error) {}
            //     return () => {
            //         console.log("unsubscribe from data stream");
            //     };
            // });

            //cache
            this.cache.set(path, { subject, stream, headers });
            return stream;
        } else return x.stream;
    }

    get<T>(path: string, query?: QueryDescriptor, options?: any): Observable<ApiGetResult<T>> {
        return this.fetch<ApiGetResult<T>>(path, query, options).pipe(map((x) => x.data));
    }

    async put(path: string, value: any): Promise<any> {
        path = prefixPath(path);
        const res = await this.api.put(path, value);
        await this.refresh(path);
        return res;
    }

    async patch(path: string, patches: Patch[]) {
        path = prefixPath(path);
        const res = await this.api.patch(path, patches);
        await this.refresh(path);
        return res;
    }

    async post<T>(path: string, value: T) {
        path = prefixPath(path);
        const res = await this.api.post(path, value);
        await this.refresh(path);
        return res;
    }

    async delete(path: string) {
        path = prefixPath(path);
        const res = await this.api.delete(path);
        await this.refresh(path);
        return res;
    }

    async refresh(path: string) {
        path = prefixPath(path);

        this.recycleCache(); // remove unused subjects
        const subjects = this.cache.map();
        for (let i = 0; i < subjects.length; i++) {
            const mapItem = subjects[i];
            const key = prefixPath(mapItem.key.split("?")[0]);

            if (path.startsWith(key)) {
                const subject = mapItem.value.subject;

                //api source
                const data = await firstValueFrom(
                    this.api.fetch(mapItem.key, mapItem.value.headers).pipe(
                        map((res) => {
                            const meta: { [key: string]: string } = {};
                            const keys = res.headers.keys().filter((k) => k.toLowerCase().startsWith("x-get-"));
                            keys.forEach((k) => (meta[k.substring(6)] = res.headers.get(k)));
                            return {
                                data: res.body,
                                meta: keys.length ? meta : undefined,
                                source: { type: "api" },
                            } as DataResult;
                        }),
                    ),
                );
                subject.next(<any>data);
            }
        }
    }

    private recycleCache() {
        this.cache
            .mapItems()
            .filter((x) => !x.item.value.subject.observed)
            .forEach((x) => {
                x.item.value.subject.complete();
                x.item.value.subject.unsubscribe();
                this.cache.remove(x.key);
            });
    }
}
