import { ProviderOptions } from "./model";
import { HttpClient } from "@angular/common/http";
import { ClientDataSource } from "./client.data.source";
import { firstValueFrom } from "rxjs";


export class UrlDataSource<T = any> extends ClientDataSource<T> {
    constructor(public readonly url: string, public readonly http: HttpClient) {
        super([]);

        firstValueFrom(this.http.get<T[]>(url)).then(data => this.all = data);
    }
}
