import { HttpClient, HttpResponse } from "@angular/common/http";
import { Injectable, Inject, inject } from "@angular/core";
import { APIBASE, MetaDataDescriptor } from "./di.token";
import { firstValueFrom, from, Observable } from "rxjs";
import { switchMap, timeout } from "rxjs/operators";
import { Patch } from "@noah-ark/json-patch";

export type AggResult<T> = {
    data: T[];
    total: number;
    query: Record<string, string>;
};

@Injectable({ providedIn: "root" })
export class ApiService {
    _timeout = 30000;

    private combinePath(api_base: string, path: string) {
        let base = (api_base ?? "").trim();
        path = (path ?? "").trim();
        while (base.endsWith("/")) base = base.substring(0, base.length - 1);

        path = (path ?? "").trim();
        while (path.startsWith("/")) path = path.substring(1);
        return base + "/" + path;
    }

    private readonly http = inject(HttpClient);
    readonly api_base_Promise = inject<Promise<string>>(APIBASE);
    private _api_base: string | null = null;
    get api_base() {
        return this._api_base;
    }

    private _req = (rx: (api_base: string) => Observable<any>) => from(this.api_base_Promise).pipe(switchMap((api_base) => rx(api_base)));

    get<T>(path: string): Observable<T> {
        return this._req((api_base) => this.http.get<T>(this.combinePath(api_base, path)).pipe(timeout(this._timeout)));
    }

    fetch<T>(path: string, headers?: MetaDataDescriptor): Observable<HttpResponse<T>> {
        return this._req((api_base) => this.http.get<T>(this.combinePath(api_base, path), { headers, observe: "response" }).pipe(timeout(this._timeout)));
    }

    patch(path: string, patch: Patch[]): Promise<any> {
        return firstValueFrom(this._req((api_base) => this.http.patch(this.combinePath(api_base, path), patch).pipe(timeout(this._timeout))));
    }

    post<T>(path: string, data: T): Promise<any> {
        return firstValueFrom(this._req((api_base) => this.http.post(this.combinePath(api_base, path), data).pipe(timeout(this._timeout))));
    }

    put<T>(path: string, data: T): Promise<any> {
        return firstValueFrom(this._req((api_base) => this.http.put(this.combinePath(api_base, path), data).pipe(timeout(this._timeout))));
    }

    delete<T>(path: string): Promise<any> {
        return firstValueFrom(this._req((api_base) => this.http.delete(this.combinePath(api_base, path)).pipe(timeout(this._timeout))));
    }
}
