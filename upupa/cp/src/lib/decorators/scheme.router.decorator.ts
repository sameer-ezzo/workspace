import { ScaffoldingScheme } from "../../types";
import { FormViewScaffolderService } from "../default-scaffolders/form-view.scaffolder.service";
import { GenericListViewScaffolder } from "../default-scaffolders/list-view.scaffolder.service";
import { DynamicFormInputs, formScheme } from "@upupa/dynamic-form";
import 'reflect-metadata'

import { toTitleCase } from "@upupa/common";
import { CPCommandPosition, CreateFormOptions, EditFormOptions, ListViewOptions, ModelSchemeRouteOptions, ViewFormOptions, ViewMetaOptions } from "./decorator.types";
import { JsonPointer } from "@noah-ark/json-patch";

export const _LISTS_INFO: Record<string, Partial<ListViewOptions>> = {};
const _scaffoldingScheme: ScaffoldingScheme = {};


export function resolvePathScaffolders(path: string) {
    const hasCreate = _scaffoldingScheme['create']?.[path] !== undefined;
    const hasEdit = _scaffoldingScheme['edit']?.[path] !== undefined;
    const hasView = _scaffoldingScheme['view']?.[path] !== undefined;
    const hasList = _scaffoldingScheme['list']?.[path] !== undefined;
    return { hasCreate, hasEdit, hasView, hasList };
}

export const getListInfoOf = (path: string) => Object.assign({}, _LISTS_INFO[path]);


function getScaffoldingScheme() { return _scaffoldingScheme }
export function mergeScaffoldingScheme(scheme?: ScaffoldingScheme): ScaffoldingScheme {
    for (const key in scheme) {
        _scaffoldingScheme[key] = { ..._scaffoldingScheme[key], ...scheme[key] }
    }
    return _scaffoldingScheme;
}
export const scaffoldingScheme = getScaffoldingScheme()
export function getListScaffolder(path: string) {
    return JsonPointer.get(_scaffoldingScheme, path, '/');
}

export function listScaffolder(path: string, options: ListViewOptions = {}) {
    return function (target) {
        if ((options.text || '').trim().length === 0) options.text = toTitleCase(path);

        const registeredRoute = _scaffoldingScheme['list']?.[path];

        const scaffolder = registeredRoute?.type || options['scaffolder'] || GenericListViewScaffolder;
        const listRoute = { [path]: { type: scaffolder, meta: options } };
        _scaffoldingScheme['list'] = { ..._scaffoldingScheme['list'], ...listRoute }

        const listInfo: Partial<ListViewOptions> = {
            columns: Reflect.getMetadata('LIST_COLUMN_DESCRIPTORS', target) || _LISTS_INFO[target.name]?.['columns'] || {},
            select: Reflect.getMetadata('LIST_SELECT', target) || _LISTS_INFO[target.name]?.['select'] || [],
            ...options,
            positions: options.positions === null ? null : options.positions?.length ? options.positions as CPCommandPosition[] : ['sidebar']
        }
        _LISTS_INFO[path] = listInfo;

    }
}
export function createFormScaffolder(path: string, options: CreateFormOptions = {}) {
    return function (target) {
        applyFormScheme(path, target, options);
        const registeredRoute = _scaffoldingScheme['create']?.[path];
        const type = registeredRoute?.type ?? options.scaffolder ?? FormViewScaffolderService
        const createRoute = { [path]: { type } };
        if (options) createRoute[path]['meta'] = options;
        _scaffoldingScheme['create'] = { ..._scaffoldingScheme['create'], ...createRoute }
    }
}
export function editFormScaffolder(path: string, options: EditFormOptions = { selector: ':id', options: {} }) {
    return function (target) {
        applyFormScheme(path, target, options.options);


        const { selector, options: editOptions } = options;
        const s = selector || ':id'

        const registeredRoute = _scaffoldingScheme['edit']?.[path]?.[s];
        const type = registeredRoute?.type ?? options.scaffolder ?? FormViewScaffolderService;
        const editRoute = { [path]: { [s]: { type } } };
        if (editOptions) editRoute[path][s]['meta'] = editOptions;

        _scaffoldingScheme['edit'] = { ..._scaffoldingScheme['edit'], ...editRoute }
    }
}
export function viewFormScaffolder(path: string, options: ViewFormOptions = { selector: ':id', options: {} }) {
    return function (target) {
        applyFormScheme(path, target);

        const { selector, options: editOptions } = options;
        const s = selector || ':id'
        const registeredRoute = _scaffoldingScheme['edit']?.[path]?.[s];
        const type = registeredRoute?.type ?? options.scaffolder ?? FormViewScaffolderService;

        const viewRoute = { [path]: { [s]: { type } } };
        if (editOptions) viewRoute[path][s]['meta'] = editOptions;

        _scaffoldingScheme['view'] = { ..._scaffoldingScheme['view'], ...viewRoute }
    }
}


function applyFormScheme(path: string, target: any, options: Omit<DynamicFormInputs, 'scheme'> = {}) {
    const p = Reflect.getMetadata('path', target) || null;
    const opts = {
        name: options.name,
        initialValueFactory: options.initialValueFactory,
        recaptcha: options.recaptcha,
        preventDirtyUnload: options.preventDirtyUnload,
        conditions: options.conditions,
        theme: options.theme,
    } as DynamicFormInputs
    if (p !== path) formScheme(path, opts)(target);
}
export function formScaffolder(path: string, options: { editForm?: EditFormOptions, viewForm?: EditFormOptions, createForm?: CreateFormOptions } = {
    editForm: { selector: ':id', options: {} },
    viewForm: { selector: ':id', options: {} },
    createForm: {}
}) {
    return function (target) {

        const opts = {
            editForm: { selector: ':id', options: {} },
            createForm: {},
            viewForm: {},
            ...options
        };
        if (options.createForm !== null) {
            createFormScaffolder(path, opts.createForm)(target)
        };
        if (options.editForm !== null) {
            editFormScaffolder(path, opts.editForm as EditFormOptions)(target)
        };
        if (options.viewForm !== null) {
            editFormScaffolder(path, opts.editForm as EditFormOptions)(target)
        };
    }
}

export function scaffolder(path: string, options: ViewMetaOptions & ModelSchemeRouteOptions = {}) {
    return function (target) {

        const opts = {
            ...options,
            // text: toTitleCase(path),
            createForm: { ...(options.createForm ?? {}) },
            editForm: {
                selector: options.editForm?.selector || ':id',
                options: { ...(options.editForm?.options ?? {}) },
                scaffolder: options.editForm?.scaffolder
            },
            viewForm: {
                selector: options.viewForm?.selector || ':id',
                options: { ...(options.viewForm?.options ?? {}) },
                scaffolder: options.viewForm?.scaffolder
            }
        } as ViewMetaOptions & ModelSchemeRouteOptions;
        // const listMeta = {
        //     icon: opts.icon,
        //     text: opts.text,
        //     group: opts.group,
        //     positions: opts.positions
        // }
        if (options.listView !== null) listScaffolder(path, { /*...listMeta,*/ ...opts.listView })(target)
        if (options.createForm !== null) createFormScaffolder(path, opts.createForm)(target);
        if (options.editForm !== null) editFormScaffolder(path, opts.editForm)(target);
        if (options.viewForm !== null) viewFormScaffolder(path, opts.editForm)(target);
    }
}