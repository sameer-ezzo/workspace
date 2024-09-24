import { ScaffoldingScheme } from '../../types';
import { FormViewScaffolderService } from '../default-scaffolders/form-view.scaffolder.service';
import { GenericListViewScaffolder } from '../default-scaffolders/list-view.scaffolder.service';
import { formScheme, DynamicFormOptions } from '@upupa/dynamic-form';
import 'reflect-metadata';

import { ActionDescriptor, ActionEvent, toTitleCase } from '@upupa/common';
import {
  CPCommandPosition,
  CreateFormOptions,
  EditFormOptions,
  ListViewOptions,
  ModelSchemeRouteOptions,
  ViewFormOptions,
  ViewMetaOptions,
} from './decorator.types';
import { JsonPointer } from '@noah-ark/json-patch';
import {
  ColumnDescriptor,
  ColumnsDescriptor,
  DataTableComponent,
} from '@upupa/table';
import { DatePipe } from '@angular/common';
import {
  DataAdapter,
  DataAdapterDescriptor,
  DataAdapterType,
  ProviderOptions,
} from '@upupa/data';
import { Injector, Type } from '@angular/core';
export type DataListViewModelType = any;

const dataListInputsMetadataKey = Symbol('custom:data_list_view_model_inputs');

export type DataListViewModelQueryParam = {
  param: string;
  path: string;
  fromValueFn: (...args: any[]) => string;
  options: { updateOnUrlChange: boolean } & Record<string, unknown>;
};
export type DataListViewModelInputs = {
  dataAdapterDescriptor: DataAdapterDescriptor<DataAdapterType>;
  headerActions: {
    order: number;
    descriptor: (rows: any[]) => DataTableActionDescriptor;
  }[];
  rowActions: {
    order: number;
    descriptor: (row: any) => DataTableActionDescriptor;
  }[];
  columns: ColumnsDescriptor;
  queryParams: DataListViewModelQueryParam[];
};

export type DataTableActionDescriptor = ActionDescriptor & {
  handlerName: string;
};

export function resolveDataListInputsFor(target: any): DataListViewModelInputs {
  return Reflect.getMetadata(dataListInputsMetadataKey, target);
}

const setDataListMetadataFor = (
  target: any,
  value: Record<string, unknown>
) => {
  let metadata = resolveDataListInputsFor(target);
  const parent = target.prototype
    ? Object.getPrototypeOf(target.prototype)?.constructor
    : null;
  if (parent && parent.constructor)
    metadata = { ...resolveDataListInputsFor(parent), ...metadata };
  Reflect.defineMetadata(
    dataListInputsMetadataKey,
    { ...metadata, ...value },
    target
  );
};

export const _LISTS_INFO: Record<string, Partial<ListViewOptions>> = {};
const _scaffoldingScheme: ScaffoldingScheme = {};

export function resolvePathScaffolders(path: string) {
  const hasCreate = _scaffoldingScheme['create']?.[path] !== undefined;
  const hasEdit = _scaffoldingScheme['edit']?.[path] !== undefined;
  const hasView = _scaffoldingScheme['view']?.[path] !== undefined;
  const hasList = _scaffoldingScheme['list']?.[path] !== undefined;
  return { hasCreate, hasEdit, hasView, hasList };
}

export const getListInfoOf = (path: string) =>
  Object.assign({}, _LISTS_INFO[path]);

function getScaffoldingScheme() {
  return _scaffoldingScheme;
}
export function mergeScaffoldingScheme(
  scheme?: ScaffoldingScheme
): ScaffoldingScheme {
  for (const key in scheme) {
    _scaffoldingScheme[key] = { ..._scaffoldingScheme[key], ...scheme[key] };
  }
  return _scaffoldingScheme;
}
export const scaffoldingScheme = getScaffoldingScheme();
export function getListScaffolder(path: string) {
  return JsonPointer.get(_scaffoldingScheme, path, '/');
}

export function listScaffolder(path: string, options: ListViewOptions = {}) {
  return function (target) {
    if ((options.text || '').trim().length === 0)
      options.text = toTitleCase(path);

    const registeredRoute = _scaffoldingScheme['list']?.[path];

    const scaffolder =
      registeredRoute?.type ||
      options['scaffolder'] ||
      GenericListViewScaffolder;
    const listRoute = { [path]: { type: scaffolder, meta: options } };
    _scaffoldingScheme['list'] = {
      ..._scaffoldingScheme['list'],
      ...listRoute,
    };

    const listInfo: Partial<ListViewOptions> = {
      columns:
        Reflect.getMetadata('LIST_COLUMN_DESCRIPTORS', target) ||
        _LISTS_INFO[target.name]?.['columns'] ||
        {},
      // select:
      //   Reflect.getMetadata('LIST_SELECT', target) ||
      //   _LISTS_INFO[target.name]?.['select'] ||
      //   [],
      ...options,
      positions:
        options.positions === null
          ? null
          : options.positions?.length
          ? (options.positions as CPCommandPosition[])
          : ['sidebar'],
    };
    _LISTS_INFO[path] = listInfo;
  };
}

// export function dataFormViewModel(options: DataFormViewModelOptions = {}) {
//   return function (target) {
//     //
//     applyFormScheme(options?.path, target, { ...options });
//   };
// }

export function createFormScaffolder(
  path: string,
  options: CreateFormOptions = {}
) {
  return function (target) {
    applyFormScheme(path, target, { ...options, path });
    const registeredRoute = _scaffoldingScheme['create']?.[path];
    const type =
      registeredRoute?.type ?? options.scaffolder ?? FormViewScaffolderService;
    const createRoute = { [path]: { type } };
    if (options) createRoute[path]['meta'] = options;
    _scaffoldingScheme['create'] = {
      ..._scaffoldingScheme['create'],
      ...createRoute,
    };
  };
}
export function editFormScaffolder(
  path: string,
  options: EditFormOptions = { selector: ':id' }
) {
  const opts = { ...{ selector: ':id', options: {} }, ...options };
  return function (target) {
    applyFormScheme(path, target, opts.options);

    const { selector, options: editOptions } = opts;
    const s = selector || ':id';

    const registeredRoute = _scaffoldingScheme['edit']?.[path]?.[s];
    const type =
      registeredRoute?.type ?? options.scaffolder ?? FormViewScaffolderService;
    const editRoute = { [path]: { [s]: { type } } };
    if (editOptions) editRoute[path][s]['meta'] = editOptions;

    _scaffoldingScheme['edit'] = {
      ..._scaffoldingScheme['edit'],
      ...editRoute,
    };
  };
}
export function viewFormScaffolder(
  path: string,
  options: ViewFormOptions = { selector: ':id', options: {} }
) {
  const opts = { ...{ selector: ':id', options: {} }, ...options };

  return function (target) {
    applyFormScheme(path, target);

    const { selector, options: viewOptions } = opts;
    const s = selector || ':id';
    const registeredRoute = _scaffoldingScheme['edit']?.[path]?.[s];
    const type =
      registeredRoute?.type ?? options.scaffolder ?? FormViewScaffolderService;

    const viewRoute = { [path]: { [s]: { type } } };
    if (viewOptions) viewRoute[path][s]['meta'] = viewOptions;

    _scaffoldingScheme['view'] = {
      ..._scaffoldingScheme['view'],
      ...viewRoute,
    };
  };
}

function applyFormScheme(
  path: string,
  target: any,
  options: Partial<DynamicFormOptions> = {}
) {
  const opts = {
    name: options.name,
    initialValueFactory: options.initialValueFactory,
    recaptcha: options.recaptcha,
    preventDirtyUnload: options.preventDirtyUnload,
    conditions: options.conditions,
    theme: options.theme,
    locales: options.locales,
    path,
  } as DynamicFormOptions;

  formScheme(opts)(target);
}

export function formScaffolder(
  path: string,
  options: {
    editForm?: EditFormOptions;
    viewForm?: EditFormOptions;
    createForm?: CreateFormOptions;
  } = {
    editForm: { selector: ':id', options: {} },
    viewForm: { selector: ':id', options: {} },
    createForm: {},
  }
) {
  return function (target) {
    const opts = {
      editForm: { selector: ':id', options: {} },
      viewForm: { selector: ':id', options: {} },
      createForm: {},
      ...options,
    };
    if (options.createForm !== null) {
      createFormScaffolder(path, opts.createForm)(target);
    }
    if (options.editForm !== null) {
      editFormScaffolder(path, opts.editForm as EditFormOptions)(target);
    }
    if (options.viewForm !== null) {
      editFormScaffolder(path, opts.editForm as EditFormOptions)(target);
    }
  };
}

export function scaffolder(path: string, options?: any) {
  options = options || {};
  return function (target) {
    const opts = {
      ...options,
      createForm: { ...(options.createForm ?? {}) },
      editForm: {
        selector: options.editForm?.selector || ':id',
        options: { ...(options.editForm?.options ?? {}) },
        scaffolder: options.editForm?.scaffolder,
      },
      viewForm: {
        selector: options.viewForm?.selector || ':id',
        options: { ...(options.viewForm?.options ?? {}) },
        scaffolder: options.viewForm?.scaffolder,
      },
    } as ViewMetaOptions & ModelSchemeRouteOptions;

    if (options.listView !== null)
      listScaffolder(path, { /*...listMeta,*/ ...opts.listView })(target);
    if (options.createForm !== null)
      createFormScaffolder(path, opts.createForm)(target);
    if (options.editForm !== null)
      editFormScaffolder(path, opts.editForm)(target);
    if (options.viewForm !== null)
      viewFormScaffolder(path, opts.editForm)(target);
  };
}

// generate property decorator for header action that register the action in the parent class meta data in array.
type DataTableHeaderActionDescriptor = { order?: number } & (
  | ActionDescriptor
  | ((rows: any[]) => ActionDescriptor)
);
export function headerAction(action: DataTableHeaderActionDescriptor) {
  return function (target: any, propertyKey: string) {
    const inputs = resolveDataListInputsFor(target.constructor);
    const headerActions = inputs?.headerActions ?? [];
    const actionFn =
      typeof action === 'function' ? action : (rows: any[]) => action;

    const descriptorFn = (rows: any): DataTableActionDescriptor => {
      return {
        ...actionFn(rows),
        handlerName: propertyKey,
      } as DataTableActionDescriptor;
    };
    headerActions.push({
      order: action.order || headerActions.length,
      descriptor: descriptorFn,
    });
    headerActions.sort((a, b) => (a.order || 0) - (b.order || 0));
    setDataListMetadataFor(target.constructor, { ...inputs, headerActions });
  };
}

type DataTableRowActionDescriptor = { order?: number } & (
  | ActionDescriptor
  | ((row: any) => ActionDescriptor)
);

export function rowAction(action: Partial<DataTableRowActionDescriptor>) {
  return function (target: any, propertyKey: string) {
    const inputs = resolveDataListInputsFor(target.constructor);
    const rowActions = inputs?.rowActions ?? [];
    const actionFn =
      typeof action === 'function' ? action : (row: any) => action;
    const descriptorFn = (row: any): DataTableActionDescriptor => {
      return {
        ...actionFn(row),
        handlerName: propertyKey,
      } as DataTableActionDescriptor;
    };
    rowActions.push({
      order: action.order || rowActions.length,
      descriptor: descriptorFn,
    });
    rowActions.sort((a, b) => (a.order || 0) - (b.order || 0));
    setDataListMetadataFor(target.constructor, { ...inputs, rowActions });
  };
}

export function queryParam(
  param?: string,
  fromValueFn?: (value, params, ...args: any[]) => string | undefined,
  options: Partial<DataListViewModelQueryParam['options']> = {
    updateOnUrlChange: true,
  }
) {
  return function (target: any, propertyKey: string) {
    const paramName = param ?? propertyKey;
    const path = propertyKey;
    fromValueFn =
      fromValueFn ?? ((_, params) => JsonPointer.get(target, propertyKey, '/'));

    const inputs = resolveDataListInputsFor(target.constructor);
    const queryParams = inputs?.queryParams ?? [];
    queryParams.push({
      param: paramName,
      path: propertyKey,
      fromValueFn,
      options: { ...options } as any,
    });
    setDataListMetadataFor(target.constructor, { ...inputs, queryParams });
  };
}
export function column(options: ColumnDescriptor = { visible: true }) {
  return function (target: any, propertyKey: string) {
    const inputs = resolveDataListInputsFor(target.constructor);
    const columns = !inputs?.columns
      ? []
      : Array.isArray(inputs.columns)
      ? Array.from(inputs.columns)
      : Object.entries(inputs.columns);

    const text = options.header ?? toTitleCase(propertyKey);
    options.header = text;
    const key = options.displayPath ?? propertyKey;
    if (options.pipe === undefined) {
      const colDataType = Reflect.getMetadata(
        'design:type',
        target,
        propertyKey
      );
      if (colDataType === Date) {
        options.pipe = { pipe: DatePipe, args: ['short'] };
      }
    }
    const col = [key, options];
    columns.push(col);

    const orderedColumns = columns
      .map(([key, value], index) => [
        key,
        typeof value === 'number'
          ? { visible: value === 1, order: index + 1 }
          : { ...value, order: value.order || index + 1 },
      ])
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
export function dataListViewModel(
  options: Partial<DataListViewModelOptions> = {}
) {
  return function (target: any) {
    setDataListMetadataFor(target, options);
  };
}

export type ApiDataListViewModelParamFunc<T = string> = (
  url: string,
  params?: Record<string, string>,
  queryParams?: Record<string, string>,
  ...args: []
) => T;
export type ApiDataListViewModelOptions = Omit<
  DataListViewModelOptions,
  'dataAdapterDescriptor'
> & {
  path: string | ApiDataListViewModelParamFunc<string>;
  adapterOptions?: ApiDataListViewModelParamFunc<Partial<ProviderOptions<any>>>;
  formViewModel: Type<any> | ApiDataListViewModelParamFunc<Type<any>>;
};
export function apiDataListViewModel(
  options?: Partial<ApiDataListViewModelOptions>
) {
  const dataAdapterDescriptor = {
    path: (url: string, params: Record<string, string>) =>
      params['collection'] ?? url,
    adapterOptions: options?.adapterOptions,
    type: 'server',
  };
  return function (target: any) {
    dataListViewModel({
      dataAdapterDescriptor,
      formViewModel: options?.formViewModel,
    } as DataListViewModelOptions)(target);
  };
}
