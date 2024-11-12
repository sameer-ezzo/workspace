import { Injector } from '@angular/core';
import { DataAdapter } from '@upupa/data';
import { ColumnsDescriptor, DataTableComponent } from '@upupa/table';
import { DataListWithInputsComponent } from '../data-list-with-inputs.component';




export type DataListViewModelActionContext = {
    component: DataListWithInputsComponent;
    dataTable: DataTableComponent;
    rowElement?: any;
} & Record<string, any>;

export interface DataListViewModel {
    injector: Injector;
    component: any;

    dataAdapter: DataAdapter<this>;
    columns: ColumnsDescriptor;
    inputs: any;
}

export function isClass(func: any): boolean {
    return typeof func === 'function' && func.prototype && func.prototype.constructor === func;
}

export function isNonClassFunction(func: any): boolean {
    return !isClass(func);
}