import "reflect-metadata";

import { toTitleCase } from "@upupa/common";
import { ColumnDescriptor, resolveDataListInputsFor, setDataListMetadataFor } from "@upupa/table";
import { DatePipe } from "@angular/common";
import { DataAdapterDescriptor, DataAdapterType, DataLoaderOptions } from "@upupa/data";
import { Type } from "@angular/core";
export type DataListViewModelType = any;

export function queryParam(param?: string) {
    return function (target: any, propertyKey: string) {
        const paramName = param ?? propertyKey;

        const inputs = resolveDataListInputsFor(target.constructor);
        const queryParams = inputs?.queryParams ?? [];
        queryParams.push({ param: paramName ?? propertyKey, propertyKey });
        setDataListMetadataFor(target.constructor, { ...inputs, queryParams });
    };
}
export function column(options: ColumnDescriptor = { visible: true }) {
    return function (target: any, propertyKey: string) {
        const inputs = resolveDataListInputsFor(target.constructor);
        const columns = !inputs?.columns ? [] : Array.isArray(inputs.columns) ? Array.from(inputs.columns) : Object.entries(inputs.columns);

        const text = options.header ?? toTitleCase(propertyKey);
        options.header = text;
        const key = options.displayPath ?? propertyKey;
        if (options.pipe === undefined) {
            const colDataType = Reflect.getMetadata("design:type", target, propertyKey);
            if (colDataType === Date) {
                options.pipe = { pipe: DatePipe, args: ["short"] };
            }
        }
        const col = [key, options];
        columns.push(col);

        const orderedColumns = columns
            .map(([key, value], index) => [key, typeof value === "number" ? { visible: value === 1, order: index + 1 } : { ...value, order: value.order || index + 1 }])
            .sort((a, b) => (a[1].order || 0) - (b[1].order || 0));
        setDataListMetadataFor(target.constructor, {
            ...inputs,
            columns: orderedColumns,
        });
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
