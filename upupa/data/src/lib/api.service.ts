import { HttpClient, HttpResponse } from "@angular/common/http";
import { Injectable, Inject } from "@angular/core";
import { APIBASE, MetaDataDescriptor } from "./di.token";
import { firstValueFrom, Observable } from "rxjs";
import { retry, timeout } from "rxjs/operators";
import { Patch } from "@noah-ark/json-patch";


export type AggResult<T> = {
    data: T[],
    total: number
    query: Record<string, string>
}


@Injectable({ providedIn: 'root' })
export class ApiService {

    _timeout = 5000;

    private combinePath(path: string) {
        let base = (this.api_base ?? '').trim();
        while (base.endsWith('/')) base = base.substring(0, base.length - 1);

        path = (path ?? '').trim();
        while (path.startsWith('/')) path = path.substring(1);
        return base + '/' + path;
    }

    private combinePathV2(path: string) {
        let base = this.api_base.trim();
        while (base.endsWith('/')) base = base.substring(0, base.length - 1);

        path = (path ?? '').trim();
        while (path.startsWith('/')) path = path.substring(1);
        return `${base}/v2/${path}`
    }

    constructor(private http: HttpClient, @Inject(APIBASE) public readonly api_base: string = '/api') {
    }

    get<T>(path: string): Observable<T> {
        return this.http.get<T>(this.combinePath(path)).pipe(timeout(this._timeout));
    }

    fetch<T>(path: string, headers?: MetaDataDescriptor): Observable<HttpResponse<T>> {
        return this.http.get<T>(this.combinePath(path), { headers, observe: 'response' }).pipe(timeout(this._timeout));
    }

    patch(path: string, patch: Patch[]): Promise<any> {
        return firstValueFrom(this.http.patch(this.combinePath(path), patch).pipe(timeout(this._timeout))); //todo make use of this return
    }

    post<T>(path: string, data: T): Promise<any> {
        return firstValueFrom(this.http.post(this.combinePath(path), data).pipe(timeout(this._timeout)));
    }

    put<T>(path: string, data: T): Promise<any> {
        return firstValueFrom(this.http.put(this.combinePath(path), data).pipe(timeout(this._timeout)));
    }

    delete<T>(path: string): Promise<any> {
        return firstValueFrom(this.http.delete(this.combinePath(path)).pipe(timeout(this._timeout)));
    }

    agg<T>(path: string): Observable<AggResult<T>> {
        return this.http.get<AggResult<T>>(this.combinePathV2(path)).pipe(timeout(this._timeout));
    }

}