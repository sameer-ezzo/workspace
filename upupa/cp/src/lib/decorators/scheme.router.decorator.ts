import { DataFormViewModel, DataListFilterForm, DataListViewModel, FormScaffoldingModel, IScaffolder, ListScaffoldingModel, ScaffoldingScheme } from "../../types";
import { FormViewScaffolderService } from "../default-scaffolders/form-view.scaffolder.service";
import { GenericListViewScaffolder } from "../default-scaffolders/list-view.scaffolder.service";
import { FormScheme, formScheme } from "@upupa/dynamic-form";
import 'reflect-metadata'
import { ColumnDescriptor } from '@upupa/table';

import { toTitleCase } from "@upupa/common";
import { DatePipe } from "@angular/common";
import { FactorySansProvider } from "@angular/core";

const _scaffoldingScheme: ScaffoldingScheme = {};

export function resolvePathScaffolders(path: string) {
    const hasCreate = _scaffoldingScheme['create']?.[path] !== undefined;
    const hasEdit = _scaffoldingScheme['edit']?.[path] !== undefined;
    const hasView = _scaffoldingScheme['view']?.[path] !== undefined;
    const hasList = _scaffoldingScheme['list']?.[path] !== undefined;
    return { hasCreate, hasEdit, hasView, hasList };
}

export type ViewMetaOptions = {
    position?: 'sidebar' | string
    text?: string
    icon?: string
    group?: string
}

type ScaffolderOption = { scaffolder?: IScaffolder<ListScaffoldingModel> | any };
export type QueryFactoryProvider = FactorySansProvider & { useFactory: (...deps: any[]) => Iterable<readonly [string, string]> }
export type ListViewModelOptions = Partial<Omit<DataListViewModel, 'filterForm' | 'query' | 'queryParams'>> & {
    filterForm?: Partial<Omit<DataListFilterForm, 'fields'>> & { fields: FormScheme | string },
    query?: ((...deps: any[]) => Iterable<readonly [string, string]>) | QueryFactoryProvider,
    queryParams?: ((...deps: any[]) => Iterable<readonly [string, string]>) | QueryFactoryProvider,
};

export type ListViewOptions = ViewMetaOptions & (ScaffolderOption | ListViewModelOptions);
export type CreateFormOptions = Partial<DataFormViewModel> & { scaffolder?: IScaffolder<FormScaffoldingModel> | any, }
export type EditFormOptions = {
    selector: `:${string}`,
    scaffolder?: IScaffolder<FormScaffoldingModel> | any,
    options: Partial<DataFormViewModel> & {}
}
export type ViewFormOptions = EditFormOptions;

export type ModelSchemeRouteOptions = {
    listView?: ListViewOptions,
    createForm?: CreateFormOptions,
    editForm?: EditFormOptions,
    viewForm?: EditFormOptions
}

const _LISTS_INFO: Record<string, Partial<ListViewOptions>> = {};
export const getListInfoOf = (path: string) => Object.assign({}, _LISTS_INFO[path]);
export type ColumnOptions = ColumnDescriptor & { order?: number, includeInDataSelect?: boolean }
export function column(options: ColumnOptions = { order: 1, includeInDataSelect: true }) {
    return function (target: any, propertyKey: string) {

        const columns = Reflect.getMetadata('LIST_COLUMN_DESCRIPTORS', target) || _LISTS_INFO[target.constructor.name] || {}
        const select = Reflect.getMetadata('LIST_SELECT', target) || []
        const text = options.header ?? toTitleCase(propertyKey);
        options.header = text;
        columns[propertyKey] = options;
        delete options.includeInDataSelect;
        delete options.order;

        if (options.includeInDataSelect !== false) {
            select.push(propertyKey)
            Reflect.defineMetadata('LIST_SELECT', select, target);
        }

        if (Reflect.getMetadata('design:type', target, propertyKey) === Date) {
            if (options.pipe === undefined) {
                options.pipe = { pipe: DatePipe, args: ['short'] }
            }
        }
        Reflect.defineMetadata('LIST_COLUMN_DESCRIPTORS', columns, target);
        _LISTS_INFO[target.constructor.name] = { columns, select };
    }
}

function getScaffoldingScheme() {
    return _scaffoldingScheme //Object.freeze({ ..._scaffoldingScheme })
}
export function mergeScaffoldingScheme(scheme?: ScaffoldingScheme): ScaffoldingScheme {
    for (const key in scheme) {
        _scaffoldingScheme[key] = { ..._scaffoldingScheme[key], ...scheme[key] }
    }


    return _scaffoldingScheme;
}
export const scaffoldingScheme = getScaffoldingScheme()

export function listScaffolder(path: string, options: ListViewOptions = {}) {
    return function (target) {
        if ((options.text || '').trim().length === 0) options.text = toTitleCase(path);

        const scaffolder = options['scaffolder'] ?? GenericListViewScaffolder;
        const listRoute = { [path]: { type: scaffolder, meta: options } };
        _scaffoldingScheme['list'] = { ..._scaffoldingScheme['list'], ...listRoute }

        if (options['scaffolder']) return

        const listInfo = {
            columns: Reflect.getMetadata('LIST_COLUMN_DESCRIPTORS', target) || _LISTS_INFO[target.name]['columns'] || {},
            select: Reflect.getMetadata('LIST_SELECT', target) || _LISTS_INFO[target.name]['select'] || [],
            ...options
        }
        _LISTS_INFO[path] = listInfo;

    }
}
export function createFormScaffolder(path: string, options: CreateFormOptions = {}) {
    return function (target) {
        applyFormScheme(path, target);

        const createRoute = { [path]: { type: options.scaffolder ?? FormViewScaffolderService } };
        if (options) createRoute[path]['meta'] = options;
        _scaffoldingScheme['create'] = { ..._scaffoldingScheme['create'], ...createRoute }
    }
}
export function editFormScaffolder(path: string, options: EditFormOptions = { selector: ':id', options: {} }) {
    return function (target) {
        applyFormScheme(path, target);

        const { selector, options: editOptions } = options;
        const editRoute = { [path]: { [selector]: { type: options.scaffolder ?? FormViewScaffolderService }, meta: editOptions } };
        _scaffoldingScheme['edit'] = { ..._scaffoldingScheme['edit'], ...editRoute }
    }
}
export function viewFormScaffolder(path: string, options: ViewFormOptions = { selector: ':id', options: {} }) {
    return function (target) {
        applyFormScheme(path, target);

        const { selector, options: editOptions } = options;
        const viewRoute = { [path]: { [selector]: { type: options.scaffolder ?? FormViewScaffolderService }, meta: editOptions } };
        _scaffoldingScheme['view'] = { ..._scaffoldingScheme['view'], ...viewRoute }
    }
}


function applyFormScheme(path: string, target: any) {
    const p = Reflect.getMetadata('path', target) || null;
    if (p !== path) formScheme(path)(target);
}
export function formScaffolder(path: string, options: { editForm?: EditFormOptions, viewForm?: EditFormOptions, createForm?: CreateFormOptions } = {
    editForm: { selector: ':id', options: {} },
    viewForm: { selector: ':id', options: {} },
    createForm: {}
}) {
    return function (target) {
        applyFormScheme(path, target);

        const opts = {
            ...options,
            editForm: { selector: ':id', options: {} },
            createForm: {}
        };
        if (options.createForm !== null) createFormScaffolder(path, opts.createForm)(target);
        if (options.editForm !== null) editFormScaffolder(path, opts.editForm as EditFormOptions)(target);
        if (options.viewForm !== null) editFormScaffolder(path, opts.editForm as EditFormOptions)(target);
    }
}
export function scaffolder(path: string, options: ViewMetaOptions & ModelSchemeRouteOptions = {}) {
    return function (target) {

        const opts = {
            ...{
                text: toTitleCase(path),
                editForm: { selector: ':id', options: {} },
                viewForm: { selector: ':id', options: {} }
            } as ViewMetaOptions & ModelSchemeRouteOptions, ...options
        };
        const meta = {}
        meta['icon'] = opts.icon;
        meta['text'] = opts.text;
        meta['group'] = opts.group;
        meta['position'] = opts.position;

        if (options.listView !== null) listScaffolder(path, { ...meta, ...opts.listView })(target)
        if (options.createForm !== null) createFormScaffolder(path, opts.createForm)(target);
        if (options.editForm !== null) editFormScaffolder(path, opts.editForm)(target);
        if (options.viewForm !== null) viewFormScaffolder(path, opts.editForm)(target);
    }
}