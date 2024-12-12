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

        let x = this.cache.get(path);
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

            //NEVER.pipe(startWith): to create a strem that only emits 1 and never complete
            //multicast: share to prevent subscribers to activate api call with each subscription
            const stream = combineLatest([api$, NEVER.pipe(startWith(1))]).pipe(
                map(([apiResult]) => apiResult),
                multicast(subject),
                refCount(),
            );

            //cache
            this.cache.set(path, { subject, stream, headers });
            return stream;
        } else return x.stream;
    }

    get<T>(path: string, query?: QueryDescriptor): Observable<ApiGetResult<T>> {
        return this.fetch<ApiGetResult<T>>(path, query).pipe(map((x) => x.data));
    }

    async put(path: string, value: any): Promise<any> {
        path = prefixPath(path);
        let res = await this.api.put(path, value);
        await this.refreshCache(path);
        return res;
    }

    async patch(path: string, patches: Patch[]) {
        path = prefixPath(path);
        let res = await this.api.patch(path, patches);
        await this.refreshCache(path);
        return res;
    }

    async post<T>(path: string, value: T) {
        path = prefixPath(path);
        let res = await this.api.post(path, value);
        await this.refreshCache(path);
        return res;
    }

    async delete(path: string) {
        path = prefixPath(path);
        //TODO delete result + delete proper sync between local and api
        let res = await this.api.delete(path);
        await this.refreshCache(path);
        return res;
    }

    async refreshCache(path: string) {
        path = prefixPath(path);

        this.recycleCache(true);
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

    private recycleCache(force = false) {
        const now = new Date();
        this.cache
            .mapItems()
            .filter((x) => force || (!x.item.value.subject.observed && now.getTime() - x.item.timestamp.getTime() > 10000))
            .forEach((x) => {
                x.item.value.subject.complete();
                x.item.value.subject.unsubscribe();
                this.cache.remove(x.key);
                console.info(`${force} cleared`, x.key);
            });
    }
}
