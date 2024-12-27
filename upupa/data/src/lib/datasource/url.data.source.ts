import { DataLoaderOptions } from "./model";
import { HttpClient } from "@angular/common/http";
import { ClientDataSource } from "./client.data.source";
import { firstValueFrom } from "rxjs";

export class UrlDataSource<T = any> extends ClientDataSource<T> {
    constructor(
        public readonly url: string,
        public readonly http: HttpClient,
    ) {
        super([]);
    }

    override async load(options: DataLoaderOptions<T>): Promise<T[]> {
        const data = await firstValueFrom(this.http.get<T[]>(this.url));
        this.all.set(data);
        return data;
    }
}
