import { Type } from '@angular/core';
import { Condition } from '@noah-ark/expression-engine';
import { FormScheme } from '@upupa/dynamic-form';
import { FlatHierarchy } from '@noah-ark/path-matcher';
import { ActionDescriptor } from '@upupa/common';
import { DataAdapter, FilterDescriptor } from '@upupa/data';
import { DataFormViewModel } from './lib/data-form-with-view-model/viewmodels/data-form.viewmodel';
import { DataListViewModel } from './lib/data-list-with-inputs/viewmodels/api-data-table-viewmodel';

export type FormSubmitResult = {
  closeDialog?: boolean;
  successMessage?: string;
  redirect?: string;
};
// export type DataFormViewModel<T = any> = DynamicFormOptions<T> & {
//   value$: Observable<T>;
//   actions?: ActionDescriptor[];
//   conditions?: Condition<
//     DynamicFormEvents.AnyEvent,
//     DynamicFormCommands.AnyCommands
//   >[];
//   valueToRecord?: (form: DynamicFormComponent, value: T) => Promise<any>;
//   onSubmit?: (path: string, record: any) => Promise<FormSubmitResult>;
//   defaultSubmitOptions?: FormSubmitResult;
// };
export type DataQueryParams = {
  key: string;
  value: string | number | boolean;
}[];
export type ToFilterDescriptor = (
  value: Record<string, any>
) => FilterDescriptor;
export type DataListFilterForm = {
  position: 'sidenav-start' | 'sidenav-end' | 'dialog';
  fields: FormScheme;
  conditions?: Condition[];
  toFilterDescriptor: ToFilterDescriptor;
  filterChangeDebounceTime?: number;
  groupBy?: string; // this is the name of the field in the filter form that will be used to group the filter fields and encode them using base64
};
export type DataFormResolverResult = {
  path: string;
  formViewModel: DataFormViewModel;
};
export type DataListResolverResult = {
  path: string;
  adapter: DataAdapter;
  listViewModel: DataListViewModel;
};
export type FormResolverCollectionMap = {
  [collection: string]: DataFormResolverResult;
};

export type DataAdapterType = 'server' | 'client' | 'http';
// export type DataListViewModel<
//   TData = any,
//   AdapterType extends DataAdapterType = 'server'
// > = {
//   select: string | string[];
//   columns: ColumnsDescriptor<TData>;
//   headerActions?:
//     | ActionDescriptor[]
//     | ((
//         all: NormalizedItem<TData>[],
//         selected: NormalizedItem<TData>[]
//       ) => ActionDescriptor[]);
//   rowActions?: ActionDescriptor[] | ((row: any) => ActionDescriptor[]);
//   filterForm?: DataListFilterForm;
//   query?: (...deps: any[]) => Record<string, string | string[]>;
//   queryParams?: (...deps: any[]) => Record<string, string | string[]>;
//   adapter: DataAdapterDescriptor<AdapterType, TData>;
// };

export type ScaffoldingViewModel = {
  actions?: ActionDescriptor[] | ((row: any) => ActionDescriptor[]);
  query?: Record<string, any>;
};
export type FormScaffoldingModel = ScaffoldingViewModel & {
  type: 'form';
  viewModel: DataFormViewModel;
};
export type ListScaffoldingModel = ScaffoldingViewModel & {
  type: 'list';
  viewModel: DataListViewModel;
};
export type ScaffoldingModel = FormScaffoldingModel | ListScaffoldingModel;

export interface IScaffolder<T extends ScaffoldingModel> {
  scaffold(path: string, ...params: any[]): Promise<T> | T;
}
export type ScaffolderFactory<T extends ScaffoldingModel> = (
  path: string,
  ...params: any[]
) => Promise<T> | T;
export type Scaffolder<T extends ScaffoldingModel = ScaffoldingModel> = {
  type?: Type<IScaffolder<T>>;
  scaffold?: ScaffolderFactory<T>;
};

export type ScaffoldingScheme = FlatHierarchy<Scaffolder>;
