import { effect, Injector, runInInjectionContext } from "@angular/core";
import { DataAdapter, DataAdapterDescriptor, DataAdapterType } from "./datasource/data.adapter";
import { unreachable } from "@noah-ark/common";
import { DataService } from "./data.service";
import { ClientDataSource } from "./datasource/client.data.source";
import { ApiDataSource } from "./datasource/api.data.source";
import { TableDataSource } from "./datasource/model";

export function createDataAdapter<T = any>(descriptor: DataAdapterDescriptor<T>, injector: Injector): DataAdapter<T> {
    let dataSource: TableDataSource;

    switch (descriptor.type) {
        case "client":
            dataSource = new ClientDataSource(descriptor.data ?? []);
            break;
        case "server":
        case "api":
            dataSource = new ApiDataSource(injector.get(DataService), descriptor.path);
            descriptor.keyProperty ??= "_id" as any;
            descriptor.displayProperty ??= "name" as any;
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
