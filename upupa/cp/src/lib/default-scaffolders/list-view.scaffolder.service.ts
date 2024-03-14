import { Injectable, Injector, inject } from '@angular/core';

import { resolvePath } from './resolve-scaffolder-path.func';
import { resolveFormSchemeOf } from '@upupa/dynamic-form';
import { ActionDescriptor } from '@upupa/common';
import { DataListFilterForm, DataListViewModel, IScaffolder, ListScaffoldingModel } from '../../types';
import { getListInfoOf, resolvePathScaffolders } from '../decorators/scheme.router.decorator';
import { ListViewModelOptions, LookUpDescriptor, QueryType } from '../decorators/decorator.types';


@Injectable({ providedIn: 'root' })
export class GenericListViewScaffolder implements IScaffolder<ListScaffoldingModel>  {
    private injector = inject(Injector)
    scaffold(path: string, ...params: any[]): ListScaffoldingModel | Promise<ListScaffoldingModel> {
        const { path: _path } = resolvePath(path);
        const collection = _path.split('/').filter(s => s).pop();
        const listInfo = getListInfoOf(collection) as ListViewModelOptions;

        const actions: ActionDescriptor[] = listInfo.actions as ActionDescriptor[] ?? [
            { position: 'menu', action: 'delete', icon: 'delete_outline', text: 'Delete', menu: true },
            { position: 'bulk', action: 'delete', icon: 'delete_outline', text: 'Delete', bulk: true },
        ]
        if ((listInfo.actions ?? []).length === 0) {
            const { hasCreate, hasEdit, hasView } = resolvePathScaffolders(collection)

            if (hasCreate) actions.push({ position: 'header', action: 'create', variant: 'stroked', text: 'Create', icon: 'add_circle_outline' })
            if (hasEdit) actions.push({ variant: 'icon', action: 'edit', icon: 'edit', menu: true })
            if (hasView) actions.push({ variant: 'icon', action: 'view', icon: 'visibility', menu: true })
        }
        const queryFn = resolveQueryFn(listInfo);
        const queryParamsFn = resolveQueryParamsFn(listInfo);



        let ffVm = null as DataListFilterForm;
        if (listInfo.filterForm) {

            const filterForm = listInfo.filterForm;
            const f = filterForm.fields;
            let fields = null;
            if (f) {
                if (typeof f === 'string') fields = resolveFormSchemeOf(f as string);
                else fields = f ?? {};

                delete filterForm.fields;
                ffVm = {
                    position: 'sidenav-end',
                    ...(filterForm as DataListFilterForm), fields
                };
            }
        }

        return {
            type: 'list',
            viewModel: {
                columns: listInfo.columns ?? {},
                select: listInfo.select ?? [],
                adapter: listInfo.adapter ?? { type: 'server', keyProperty: '_id' },
                filterForm: ffVm,
                ...queryFn,
                ...queryParamsFn,
                actions
            } as DataListViewModel
        }
    }

}
function _resolveQueryFn(fn?: QueryType): Function {
    let queryFn: Function = () => undefined;
    if (!fn) return queryFn;
    if (typeof fn === 'function') queryFn = fn as Function;
    else if ('useFactory' in fn) {
        const deps = (fn['deps'] ?? []).map(c => c.trim()).filter(c => c.length).map(d => this.injector.get(d));
        queryFn = () => fn['useFactory'](...deps);
    }
    return queryFn
}
function resolveQueryFn(listInfo: Partial<ListViewModelOptions>): { query: Function } {
    const qs = _resolveQueryFn(listInfo.query)()
    const lookups = Array.from(Object.entries(listInfo.columns ?? {})).filter(([k, v]) => v['lookup'])
        .map(([k, v]) => v['lookup'] as LookUpDescriptor)
        .map((l: LookUpDescriptor) => (`${l.from}:${l.foreignField}:${l.localField}:${l.as || l.localField}:${l.single === true ? 'unwind' : ''}`))
        .join(';');

    const queryFn = () => ({ ...qs, lookup: lookups })
    return { query: queryFn };
}
function resolveQueryParamsFn(listInfo: Partial<ListViewModelOptions>): { queryParams: Function } {
    return { queryParams: _resolveQueryFn(listInfo.queryParams) }
}
