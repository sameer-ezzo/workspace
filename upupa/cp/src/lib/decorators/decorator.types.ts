import { FactorySansProvider } from '@angular/core';
import { DynamicFormInputs, FormScheme } from '@upupa/dynamic-form';

import {
  IScaffolder,
  ListScaffoldingModel,
  DataListFilterForm,
  FormScaffoldingModel,
} from '../../types';
import { SideBarGroup, SideBarItem } from '../side-bar-group-item';
import { DataListViewModel } from '../data-list-with-inputs/viewmodels/api-data-table-viewmodel';

export type LookUpDescriptor = {
  from: string;
  as: string;
  localField: string;
  foreignField: string;
  single: boolean;
};


export type CPCommandPosition = 'sidebar' | 'user-menu' | 'toolbar';
export type ViewMetaOptions = {
  positions?: CPCommandPosition[];
  text?: string;
  icon?: string;
  group?: string;
};

export type CpLayoutOptions = {
  [key in CPCommandPosition]: (SideBarGroup | SideBarItem)[];
};

type ScaffolderOption = {
  scaffolder?: IScaffolder<ListScaffoldingModel> | any;
};
export type QueryFactoryProvider = FactorySansProvider & {
  useFactory: (...deps: any[]) => Iterable<readonly [string, string]>;
};
export type QueryType =
  | ((...deps: any[]) => Iterable<readonly [string, string | number]>)
  | QueryFactoryProvider;

export type ListViewModelOptions = Partial<
  Omit<DataListViewModel, 'filterForm' | 'query' | 'queryParams'>
> & {
  filterForm?: Partial<Omit<DataListFilterForm, 'fields'>> & {
    fields: FormScheme | string;
  };
  query?: QueryType;
  queryParams?: QueryType;
};

export type ListViewOptions = ViewMetaOptions &
  (ScaffolderOption | ListViewModelOptions);
export type CreateFormOptions = Partial<DynamicFormInputs> & {
  scaffolder?: IScaffolder<FormScaffoldingModel> | any;
};
export type EditFormOptions = Partial<{
  selector: `:${string}`;
  scaffolder?: IScaffolder<FormScaffoldingModel> | any;
  options: Partial<DynamicFormInputs> & {};
}>;
export type ViewFormOptions = EditFormOptions;

export type ModelSchemeRouteOptions = {
  listView?: ListViewOptions;
  createForm?: CreateFormOptions;
  editForm?: EditFormOptions;
  viewForm?: EditFormOptions;
};

// export type DataFormWithHttpSourceOptions = {

//     path: string;
//     verb: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
//   }
// export type DataFormWithApiSourceOptions = {

//     path: string;
//     verb: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
//   }
// export type DataFormSourceOptions = DataFormWithApiSourceOptions
// export type DataFormViewModelOptions = Partial<DataFormViewModel> & ;
