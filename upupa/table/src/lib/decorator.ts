import "reflect-metadata";
import { DataAdapterDescriptor, DataAdapterType } from "@upupa/data";

import { camelCaseToTitle } from "@upupa/common";
import { ColumnDescriptor, ColumnsDescriptor, ColumnsDescriptorStrict } from "./types";
import { DatePipe } from "@angular/common";
import { Class } from "@noah-ark/common";

const dataListInputsMetadataKey = Symbol("custom:data_list_view_model_inputs");

export type DataListViewModelQueryParam = {
    param: string;
    propertyKey: string;
};
export type TableViewModelMirror = {
    secondaryRows: ColumnsDescriptorStrict;
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

export function reflectTableViewModel(target: Class, options?: { exclude?: string[]; include?: string[] }): TableViewModelMirror {
    const mirror = Reflect.getMetadata(dataListInputsMetadataKey, target) ?? ({} as TableViewModelMirror);

    let columns = mirror.columns ?? [];
    if (options?.exclude) columns = columns.filter(([key]) => !options.exclude?.includes(key));
    if (options?.include) columns = columns.filter(([key]) => options.include?.includes(key));

    return { ...mirror, columns };
}

export const setDataListMetadataFor = (target: any, value: Record<string, unknown>) => {
    let targetMeta = reflectTableViewModel(target);
    const parent = target.prototype ? Object.getPrototypeOf(target.prototype)?.constructor : null;
    if (parent && parent.constructor) targetMeta = { ...reflectTableViewModel(parent), ...targetMeta };
    Reflect.defineMetadata(dataListInputsMetadataKey, { ...targetMeta, ...value }, target);
};

export function secondaryRow(options: ColumnDescriptor = { visible: true }) {
    return function (target: any, propertyKey: string) {
        const inputs = reflectTableViewModel(target.constructor);
        const secondaryRows: ColumnsDescriptorStrict = inputs?.secondaryRows ?? {};
        const key = options.displayPath ?? propertyKey;

        const template = options.template ? (Array.isArray(options.template) ? options.template : [options.template]) : [];
        const normalizedTemplate = template.map((t) => ("component" in t ? t : { component: t }));

        setDataListMetadataFor(target.constructor, {
            ...inputs,
            secondaryRows: {
                ...secondaryRows,
                [key]: {
                    ...options,
                    header: options.header ?? camelCaseToTitle(propertyKey),
                    template: normalizedTemplate,
                },
            },
        });
    };
}

export function column(options: ColumnDescriptor = { visible: true }) {
    return function (target: any, propertyKey: string) {
        const inputs = reflectTableViewModel(target.constructor);
        const columns = !inputs?.columns ? [] : Array.isArray(inputs.columns) ? Array.from(inputs.columns) : Object.entries(inputs.columns);

        const text = options.header ?? camelCaseToTitle(propertyKey);
        options.header = text;
        const key = options.displayPath ?? propertyKey;
        if (options.pipe === undefined) {
            const colDataType = Reflect.getMetadata("design:type", target, propertyKey);
            if (colDataType === Date) {
                options.pipe = { pipe: DatePipe, args: ["short"] };
            }
        }
        if (options.template && !Array.isArray(options.template)) {
            options.template = [options.template];
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
