import { DataAdapterDescriptor, DataAdapterType } from '@upupa/data';
import { ColumnsDescriptor } from './types';

const dataListInputsMetadataKey = Symbol('custom:data_list_view_model_inputs');

export type DataListViewModelQueryParam = {
    param: string;
    propertyKey: string;
};
export type DataListViewModelInputs = {
    dataAdapterDescriptor: DataAdapterDescriptor<DataAdapterType>;
    // headerActions: {
    //     order: number;
    //     descriptor: (rows: any[]) => DataTableActionDescriptor;
    // }[];
    // rowActions: {
    //     order: number;
    //     descriptor: (row: any) => DataTableActionDescriptor;
    // }[];
    columns: ColumnsDescriptor;
    queryParams: DataListViewModelQueryParam[];
};

export function resolveDataListInputsFor(target: any): DataListViewModelInputs {
    return Reflect.getMetadata(dataListInputsMetadataKey, target) ?? {};
}

export const setDataListMetadataFor = (
    target: any,
    value: Record<string, unknown>
) => {
    let targetMeta = resolveDataListInputsFor(target);
    const parent = target.prototype
        ? Object.getPrototypeOf(target.prototype)?.constructor
        : null;
    if (parent && parent.constructor)
        targetMeta = { ...resolveDataListInputsFor(parent), ...targetMeta };
    Reflect.defineMetadata(
        dataListInputsMetadataKey,
        { ...targetMeta, ...value },
        target
    );
};
