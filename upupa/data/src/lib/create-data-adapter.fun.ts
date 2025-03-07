import { effect, Injector, runInInjectionContext } from "@angular/core";
import { DataAdapter, DataAdapterDescriptor, DataAdapterType } from "./datasource/data.adapter";
import { unreachable } from "@noah-ark/common";
import { DataService } from "./data.service";
import { ClientDataSource } from "./datasource/client.data.source";
import { ApiDataSource } from "./datasource/api.data.source";
import { TableDataSource } from "./datasource/model";

export function createDataAdapter<T = any>(descriptor: DataAdapterDescriptor<T>, injector: Injector): DataAdapter<T> {
    let dataSource: TableDataSource;
    descriptor.keyProperty ??= "_id" as keyof T;
    descriptor.mapper ??= (items) => items;
    switch (descriptor.type) {
        case "client":
            dataSource = new ClientDataSource(descriptor.data ?? [], descriptor.keyProperty, descriptor.mapper);
            break;
        case "server":
        case "api":
            dataSource = new ApiDataSource(injector.get(DataService), descriptor.path, descriptor.mapper);
            descriptor.displayProperty ??= "name" as keyof T;

            break;
        default:
            throw unreachable("data adapter type:", descriptor);
    }

    let adapter: DataAdapter<T>;
    runInInjectionContext(injector, () => {
        adapter = new DataAdapter(dataSource, descriptor.keyProperty, descriptor.displayProperty, descriptor.valueProperty, descriptor.imageProperty, descriptor.options);
    });

    return adapter!;
}
