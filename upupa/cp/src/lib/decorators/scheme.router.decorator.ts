import "reflect-metadata";

import { reflectTableViewModel, setDataListMetadataFor } from "@upupa/table";
import { DataAdapterDescriptor, DataAdapterType, DataLoaderOptions } from "@upupa/data";
import { Type } from "@angular/core";
export type DataListViewModelType = any;

export function queryParam(param?: string) {
    return function (target: any, propertyKey: string) {
        const paramName = param ?? propertyKey;

        const inputs = reflectTableViewModel(target.constructor);
        const queryParams = inputs?.queryParams ?? [];
        queryParams.push({ param: paramName ?? propertyKey, propertyKey });
        setDataListMetadataFor(target.constructor, { ...inputs, queryParams });
    };
}


export type DataListViewModelOptions = {
    dataAdapterDescriptor: DataAdapterDescriptor<DataAdapterType>;
};
// generate class decorator for the view model that will be used to generate the list view.
export function dataListViewModel(options: Partial<DataListViewModelOptions> = {}) {
    return function (target: any) {
        setDataListMetadataFor(target, options);
    };
}

export type ApiDataListViewModelParamFunc<T = string> = (url: string, params?: Record<string, string>, queryParams?: Record<string, string>, ...args: []) => T;
export type ApiDataListViewModelOptions = Omit<DataListViewModelOptions, "dataAdapterDescriptor"> & {
    path: string | ApiDataListViewModelParamFunc<string>;
    adapterOptions?: ApiDataListViewModelParamFunc<Partial<DataLoaderOptions<any>>>;
    formViewModel: Type<any> | ApiDataListViewModelParamFunc<Type<any>>;
};
export function apiDataListViewModel(options?: Partial<ApiDataListViewModelOptions>) {
    const dataAdapterDescriptor = {
        path: options.path ? options.path : (url: string, params: Record<string, string>) => params["collection"] ?? url,
        adapterOptions: options?.adapterOptions,
        type: "server",
    };
    return function (target: any) {
        dataListViewModel({
            dataAdapterDescriptor,
            formViewModel: options?.formViewModel,
        } as DataListViewModelOptions)(target);
    };
}
