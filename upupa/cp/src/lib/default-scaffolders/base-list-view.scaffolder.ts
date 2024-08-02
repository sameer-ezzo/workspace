import { Injectable, Injector, inject } from '@angular/core';

import { resolvePath } from './resolve-scaffolder-path.func';
import { resolveFormSchemeOf } from '@upupa/dynamic-form';
import { ActionDescriptor } from '@upupa/common';
import { DataListFilterForm, DataListViewModel, IScaffolder, ListScaffoldingModel } from '../../types';
import { getListInfoOf, resolvePathScaffolders } from '../decorators/scheme.router.decorator';
import { ListViewModelOptions, LookUpDescriptor, QueryType } from '../decorators/decorator.types';
import {  AuthService } from '@upupa/auth';
import { evaluatePermission } from '@noah-ark/expression-engine';
import { AuthorizationService } from '@upupa/authz';



@Injectable({ providedIn: 'root' })
export class BaseListViewScaffolder implements IScaffolder<ListScaffoldingModel> {

    private readonly authService = inject(AuthService)
    private readonly authorizeService = inject(AuthorizationService)

    async scaffold(path: string, ...params: any[]): Promise<ListScaffoldingModel> {
        const { path: _path } = resolvePath(path);
        const collection = _path.split('/').filter(s => s).pop();
        const listInfo = getListInfoOf(collection) as ListViewModelOptions;
        
        const evaluatedQuerySelector = await this.authorizeService.getEvaluatedQuerySelector(`api/${collection}`, 'Read', this.authService.user)

        const queryFn = resolveQueryFn(listInfo, evaluatedQuerySelector);
        const queryParamsFn = resolveQueryParamsFn(listInfo, {});


        let actions = listInfo.rowActions
        let headerActions = listInfo.headerActions
        const { hasCreate, hasEdit, hasView } = resolvePathScaffolders(collection)
        if (actions === undefined) {
            actions = [];

            if (hasEdit) actions.push({ variant: 'icon', name: 'edit', icon: 'edit' })
            if (hasView) actions.push({ variant: 'icon', name: 'view', icon: 'visibility', menu: true })
            actions.push({ position: 'menu', name: 'delete', icon: 'delete_outline', text: 'Delete', menu: true })

        }
        if (hasCreate && headerActions === undefined) {
            headerActions = []
            headerActions.push({ position: 'header', name: 'create', variant: 'stroked', text: 'Create', icon: 'add_circle_outline' })
        }


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
                rowActions: actions,
                headerActions
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
function resolveQueryFn(listInfo: Partial<ListViewModelOptions>, base: any): { query: Function } {
    const _queryFn = _resolveQueryFn(listInfo.query);
    const lookups = Array.from(Object.entries(listInfo.columns ?? {})).filter(([k, v]) => v['lookup'])
        .map(([k, v]) => v['lookup'] as LookUpDescriptor)
        .map((l: LookUpDescriptor) => (`${l.from}:${l.foreignField}:${l.localField}:${l.as || l.localField}:${l.single === true ? 'unwind' : ''}`))
        .filter(l => l.length)
        .join(';')
        .trim();


    const qs = _queryFn()
    const v = lookups.length > 0 ? { ...qs, lookup: lookups, ...base } : { ...qs, ...base }
    const queryFn = () => v
    return { query: queryFn };
}
function resolveQueryParamsFn(listInfo: Partial<ListViewModelOptions>, base: any): { queryParams: Function } {
    return { queryParams: _resolveQueryFn(listInfo.queryParams) }
}
