import { Type } from "@angular/core";
import { Condition } from "@noah-ark/expression-engine";
import { DynamicFormCommands, DynamicFormComponent, DynamicFormEvents, DynamicFormInputs, FormScheme } from "@upupa/dynamic-form";
import { ColumnsDescriptor } from "@upupa/table";
import { Observable } from "rxjs";
import { FlatHierarchy } from "@noah-ark/path-matcher";
import { ActionDescriptor } from "@upupa/common";
import { DataAdapter, FilterDescriptor, DataAdapterDescriptor } from "@upupa/data";



export type FormSubmitResult = { closeDialog?: boolean, successMessage?: string, redirect?: string }
export type DataFormViewModel<T = any> = DynamicFormInputs<T> & {

    value$: Observable<T>,
    // submitBtn?: ActionDescriptor,
    actions?: ActionDescriptor[],
    conditions?: Condition<DynamicFormEvents.AnyEvent, DynamicFormCommands.AnyCommands>[],
    valueToRecord?: (form: DynamicFormComponent, value: T) => Promise<any>,
    onSubmit?: (path: string, record: any) => Promise<FormSubmitResult>,
    defaultSubmitOptions?: FormSubmitResult
}
export type DataQueryParams = { key: string; value: string | number | boolean }[]
export type ToFilterDescriptor = (value: Record<string, any>) => FilterDescriptor
export type DataListFilterForm = {
    position: 'sidenav-start' | 'sidenav-end' | 'dialog',
    fields: FormScheme,
    conditions?: Condition[],
    toFilterDescriptor: ToFilterDescriptor,
    filterChangeDebounceTime?: number,
    groupBy?: string, // this is the name of the field in the filter form that will be used to group the filter fields and encode them using base64
}
export type DataFormResolverResult<T = any> = { path: string, formViewModel: DataFormViewModel<T> }
export type DataListResolverResult<T = any> = { path: string, adapter: DataAdapter, listViewModel: DataListViewModel<T> }
export type FormResolverCollectionMap = { [collection: string]: DataFormResolverResult };

export type DataListViewModel<TData = any, AdapterType extends 'server' | 'client' | 'http' = 'server'> = {
    select: string | string[],
    columns: ColumnsDescriptor<TData>,
    actions?: (ActionDescriptor | ((row: any) => ActionDescriptor))[],
    filterForm?: DataListFilterForm,
    query?: (...deps: any[]) => Iterable<readonly [string, string]>,
    queryParams?: (...deps: any[]) => Iterable<readonly [string, string]>,
    adapter: DataAdapterDescriptor<AdapterType, TData>,
}

export type ScaffoldingViewModel = {
    actions?: (ActionDescriptor | ((row: any) => ActionDescriptor))[],
    query?: Record<string, any>
}
export type FormScaffoldingModel = ScaffoldingViewModel & { type: 'form', viewModel: DataFormViewModel };
export type ListScaffoldingModel = ScaffoldingViewModel & { type: 'list', viewModel: DataListViewModel };
export type ScaffoldingModel = FormScaffoldingModel | ListScaffoldingModel;

export interface IScaffolder<T extends ScaffoldingModel> { scaffold(path: string, ...params: any[]): Promise<T> | T }
export type ScaffolderFactory<T extends ScaffoldingModel> = (path: string, ...params: any[]) => Promise<T> | T;
export type Scaffolder<T extends ScaffoldingModel = ScaffoldingModel> = { type?: Type<IScaffolder<T>>, scaffold?: ScaffolderFactory<T> }

export type ScaffoldingScheme = FlatHierarchy<Scaffolder>;

