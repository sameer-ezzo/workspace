import { Injectable, Injector, inject } from '@angular/core';

import { resolvePath } from './resolve-scaffolder-path.func';
import { resolveFormSchemeOf } from '@upupa/dynamic-form';
import { ActionDescriptor, toTitleCase } from '@upupa/common';
import { DataListFilterForm, DataListViewModel, IScaffolder, ListScaffoldingModel } from '../../types';
import { getListInfoOf, ListViewModelOptions, resolvePathScaffolders } from '../decorators/scheme.router.decorator';


@Injectable({ providedIn: 'root' })
export class GenericListViewScaffolder implements IScaffolder<ListScaffoldingModel>  {
    private injector = inject(Injector)
    scaffold(path: string, ...params: any[]): ListScaffoldingModel | Promise<ListScaffoldingModel> {
        const { path: _path } = resolvePath(path);
        const collection = _path.split('/').filter(s => s).pop();
        const listInfo = getListInfoOf(collection) as ListViewModelOptions;
        const actions: ActionDescriptor[] = listInfo.actions ?? [
            { position: 'menu', name: 'delete', icon: 'delete_outline', text: 'Delete', menu: true },
            { position: 'bulk', name: 'delete', icon: 'delete_outline', text: 'Delete', bulk: true },
        ]
        if ((listInfo.actions ?? []).length === 0) {
            const { hasCreate, hasEdit, hasView } = resolvePathScaffolders(collection)

            if (hasCreate) actions.push({ position: 'header', name: 'create', icon: 'add_circle_outline', text: 'Create', bulk: true })
            if (hasEdit) actions.push({ variant: 'icon', name: 'edit', icon: 'edit', menu: false })
            if (hasView) actions.push({ variant: 'icon', name: 'view', icon: 'visibility', menu: false })
        }
        const queryFn = this.resolveQueryFn(listInfo, 'query');
        const queryParamsFn = this.resolveQueryFn(listInfo, 'queryParams');


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

    private resolveQueryFn(listInfo: Partial<ListViewModelOptions>, key: 'query' | 'queryParams' = 'query') {
        let queryFn = undefined;
        if (!listInfo[key]) return { [key]: undefined };
        if (typeof listInfo[key] === 'function') queryFn = listInfo[key];
        else {
            const deps = (listInfo[key]['deps'] ?? []).map(d => this.injector.get(d));
            queryFn = () => listInfo[key]['useFactory'](...deps);
        }
        return { [key]: queryFn };
    }
}
