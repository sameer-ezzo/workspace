import { inject, Injector, runInInjectionContext } from "@angular/core";
import { DataAdapter, DataAdapterDescriptor } from "./datasource/data.adapter";
import { unreachable } from "@noah-ark/common";
import { DataService } from "./data.service";
import { ClientDataSource, SignalDataSource } from "./datasource/client.data.source";
import { ApiDataSource } from "./datasource/api.data.source";
import { TableDataSource } from "./datasource/model";

export function createDataAdapter<T = any>(descriptor: DataAdapterDescriptor<T>, injector: Injector = inject(Injector)): DataAdapter<T> {
    let dataSource: TableDataSource;

    descriptor.mapper ??= (items) => items;
    switch (descriptor.type) {
        case "server":
        case "api":
            descriptor.displayProperty ??= "name" as keyof T;
            descriptor.keyProperty ??= "_id" as keyof T;
            dataSource = new ApiDataSource(injector.get(DataService), descriptor.path, descriptor.keyProperty);
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
        case "resource":
            if (!descriptor.keyProperty) {
                const firstItem = descriptor.resource.value()[0];
                if (firstItem && firstItem["_id"]) {
                    descriptor.keyProperty = "_id" as keyof T;
                }
            }
            dataSource = new SignalDataSource(descriptor.resource.value, descriptor.keyProperty);
            break;
        default:
            throw unreachable("data adapter type:", descriptor);
    }

    const options = {
        terms: descriptor.terms ?? descriptor.options?.terms,
        page: descriptor.page ?? descriptor.options?.page,
        sort: descriptor.sort ?? descriptor.options?.sort,
        filter: descriptor.filter ?? descriptor.options?.filter,
        autoRefresh: descriptor.autoRefresh ?? descriptor.options?.autoRefresh,
    };
    return runInInjectionContext(
        injector,
        () => new DataAdapter(dataSource, descriptor.keyProperty, descriptor.displayProperty, descriptor.valueProperty, descriptor.imageProperty, options),
    );
}
