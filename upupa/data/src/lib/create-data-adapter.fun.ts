import { effect, Injector, runInInjectionContext } from "@angular/core";
import { DataAdapter, DataAdapterDescriptor, DataAdapterType } from "./datasource/data.adapter";
import { unreachable } from "@noah-ark/common";
import { DataService } from "./data.service";
import { ClientDataSource, SignalDataSource } from "./datasource/client.data.source";
import { ApiDataSource } from "./datasource/api.data.source";
import { TableDataSource } from "./datasource/model";

export function createDataAdapter<T = any>(descriptor: DataAdapterDescriptor<T>, injector: Injector): DataAdapter<T> {
    let dataSource: TableDataSource;

    descriptor.mapper ??= (items) => items;
    switch (descriptor.type) {
        case "server":
        case "api":
            descriptor.displayProperty ??= "name" as keyof T;
            descriptor.keyProperty ??= "_id" as keyof T;
            dataSource = new ApiDataSource(injector.get(DataService), descriptor.path);
            break;
        case "client":
            if (!descriptor.keyProperty) {
                const firstItem = descriptor.data?.[0];
                if (firstItem && firstItem["_id"]) {
                    descriptor.keyProperty ??= "_id" as keyof T;
                }
            }
            dataSource = new ClientDataSource(descriptor.data ?? [], descriptor.keyProperty);
            break;
        case "signal":
            if (!descriptor.keyProperty) {
                const firstItem = descriptor.data()[0];
                if (firstItem && firstItem["_id"]) {
                    descriptor.keyProperty = "_id" as keyof T;
                }
            }
            dataSource = new SignalDataSource(descriptor.data, descriptor.keyProperty);
            break;
        default:
            throw unreachable("data adapter type:", descriptor);
    }

    let adapter: DataAdapter<T>;
    const options = {
        terms: descriptor.terms ?? descriptor.options?.terms,
        page: descriptor.page ?? descriptor.options?.page,
        sort: descriptor.sort ?? descriptor.options?.sort,
        filter: descriptor.filter ?? descriptor.options?.filter,
        autoRefresh: descriptor.autoRefresh ?? descriptor.options?.autoRefresh,
    };
    runInInjectionContext(injector, () => {
        adapter = new DataAdapter(dataSource, descriptor.keyProperty, descriptor.displayProperty, descriptor.valueProperty, descriptor.imageProperty, options);
    });

    return adapter!;
}
