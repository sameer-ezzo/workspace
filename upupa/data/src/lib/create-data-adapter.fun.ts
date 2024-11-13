import { Injector } from "@angular/core";
import { DataAdapter, DataAdapterDescriptor, DataAdapterType } from "./datasource/data.adapter";
import { ITableDataSource } from "./datasource/model";
import { HttpClient } from "@angular/common/http";
import { unreachable } from "@noah-ark/common";
import { DataService } from "./data.service";
import { ClientDataSource } from "./datasource/client.data.source";
import { HttpServerDataSource } from "./datasource/http-server-data-source";
import { ServerDataSource } from "./datasource/server.data.source";

export function createDataAdapter(descriptor: DataAdapterDescriptor<DataAdapterType>, injector: Injector): DataAdapter {
    let dataSource: ITableDataSource;

    switch (descriptor.type) {
        case "client":
            dataSource = new ClientDataSource(descriptor.data ?? []);
            break;
        case "server":
        case "api":
            dataSource = new ServerDataSource(injector.get(DataService), descriptor.path, descriptor.select ?? []);
            break;
        case "http":
            const http = injector.get(HttpClient);
            dataSource = new HttpServerDataSource(http, descriptor["url"], descriptor["httpOptions"]);
            break;
        default:
            throw unreachable("data adapter type:", descriptor);
    }

    return new DataAdapter(dataSource, descriptor.keyProperty, descriptor.displayProperty, descriptor.valueProperty, descriptor.imageProperty, descriptor.options);
}
