import { Injector } from '@angular/core';
import { DataAdapter, DataService } from '@upupa/data';
import { ColumnsDescriptor, DataTableComponent } from '@upupa/table';
import { DataTableActionDescriptor } from '../../decorators/scheme.router.decorator';
import { ActionEvent, toTitleCase } from '@upupa/common';
import { ConfirmService, DialogService } from '@upupa/dialog';
import { firstValueFrom, map } from 'rxjs';
import { DataFormWithViewModelComponent } from '../../data-form-with-view-model/data-form-with-view-model.component';
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

    onQueryChange?(
        query: Record<string, string | string[]>,
        context?: DataListViewModelActionContext
    ): void;
    onQueryParamsChange?(
        params: Record<string, string | string[]>,
        context?: DataListViewModelActionContext
    ): void;
    onSelectionChange?(
        event: any,
        context?: DataListViewModelActionContext
    ): void;
    onPageChange?(page: number, context?: DataListViewModelActionContext): void;
    onPageSizeChange?(
        pageSize: number,
        context?: DataListViewModelActionContext
    ): void;
    onSearchChange?(
        search: string,
        context?: DataListViewModelActionContext
    ): void;
    onFilterChange?(
        filter: Record<string, string | string[]>,
        context?: DataListViewModelActionContext
    ): void;
    onSortChange?(sort: string, context?: DataListViewModelActionContext): void;
    onFocusedItemChanged?(
        item: any,
        context?: DataListViewModelActionContext
    ): void;
}

export function isClass(func: any): boolean {
    return (
        typeof func === 'function' &&
        func.prototype &&
        func.prototype.constructor === func
    );
}

export function isNonClassFunction(func: any): boolean {
    return !isClass(func);
}

// export class ApiDataListViewModel implements DataListViewModel {
//     injector!: Injector;
//     component!: any;
//     dataAdapter!: DataAdapter<this>;
//     columns!: ColumnsDescriptor;
//     inputs!: ApiDataListViewModelOptions & Record<string, any>;

//     private get collection() {
//         return this.dataAdapter.dataSource['path'];
//     }

//     @headerAction({ name: 'create', text: 'Create', icon: 'add' })
//     onCreate(e: ActionEvent) {
//         this.openDataFormDialog(e, 'create');
//     }

//     @rowAction({ name: 'edit', variant: 'icon', text: 'Edit', icon: 'edit' })
//     onEdit(e: ActionEvent) {
//         this.openDataFormDialog(e, 'edit');
//     }

//     @rowAction({
//         name: 'view',
//         variant: 'icon',
//         text: 'Details',
//         icon: 'visibility',
//     })
//     onView(e: ActionEvent) {
//         this.openDataFormDialog(e, 'view');
//     }

//     @rowAction({ name: 'delete', text: 'Delete', icon: 'delete', menu: true })
//     @headerAction({
//         name: 'delete',
//         text: 'Delete',
//         icon: 'delete_outline',
//         bulk: true,
//         menu: true,
//     })
//     async onDelete(e: ActionEvent<any, DataListViewModelActionContext>) {
//         const items = e.data;
//         const confirm = this.injector.get(ConfirmService);
//         const confirmRes = await confirm.openWarning({
//             title: 'Delete',
//             confirmText: `Are you sure you want to delete this item${
//                 items.length > 1 ? 's' : ''
//             }?`,
//             yes: 'Yes, delete',
//             no: 'No, cancel',
//             yesColor: 'warn',
//         });
//         if (!confirmRes) return;

//         const ds = this.injector.get(DataService);
//         const deleteTasks = items.map((item) =>
//             ds.delete(`/${this.collection}/${item._id}`)
//         );
//         const report = await Promise.allSettled(deleteTasks);
//         const failed = report.filter((x) => x.status === 'rejected');
//         if (failed.length > 0) {
//             console.error('Failed to delete items', failed);
//         }
//         await e.context.component.refreshData();
//     }

//     private async openDataFormDialog(e: ActionEvent, action: string) {
//         const inputs = { ...this.inputs };
//         if (!inputs.formViewModel) throw new Error('formViewModel is required');

//         const formViewModelCls = isNonClassFunction(inputs.formViewModel)
//             ? (inputs.formViewModel as Function)(e)
//             : inputs.formViewModel;

//         const value = await (action === 'create'
//             ? new formViewModelCls()
//             : this.getValue(e.data?.[0]));

//         const dialog = this.injector.get(DialogService);

//         const res = await firstValueFrom(
//             dialog
//                 .openDialog(DataFormWithViewModelComponent, {
//                     title: toTitleCase(`${action} ${this.collection}`),
//                     width: '100%',
//                     maxWidth: '800px',
//                     inputs: {
//                         viewModel: formViewModelCls,
//                         value,
//                     },
//                 })
//                 .afterClosed()
//         );
//         if (!res) return;
//         await e.context.component.refreshData();
//     }

//     async getValue(item: any) {
//         const ds = this.injector.get(DataService);
//         const res = await firstValueFrom(
//             ds
//                 .get<{ _id: string }[]>(`/${this.collection}/${item._id}`)
//                 .pipe(map((x) => x.data?.[0]))
//         );
//         return res;
//     }
// }

export interface ActionHandler {
    onAction(e: ActionEvent): Promise<void> | void;
}

export type DataListAction<T = any> = {
    action: DataTableActionDescriptor;
    handler: (
        e: ActionEvent<T, DataListViewModelActionContext>
    ) => void | Promise<void>;
};
export type DataListActionWithViewModel<T = any> = {
    viewModel: any;
} & Partial<DataListAction<T>>;

function actionDialog<T>(
    options: DataListActionWithViewModel<T>
): DataListAction<any> {
    return {
        action: options.action,
        handler: options.handler,
    };
}

export function CreateActionDialog<T>(
    options: DataListActionWithViewModel<T>
): DataListAction<any> {
    if (!options.viewModel)
        throw new Error('CreateActionDialog ViewModel is required');

    if (!options.action)
        options.action = { name: 'create', text: 'Create', icon: 'add' };
    if (!options.handler)
        options.handler = (e) =>
            openDataFormDialog(
                e,
                'create',
                options.viewModel,
                e.context.component.injector
            );

    return actionDialog(options);
}
export function EditActionDialog<T>(
    options: DataListActionWithViewModel<T>
): DataListAction<any> {
    if (!options.viewModel)
        throw new Error('EditActionDialog ViewModel is required');
    if (!options.handler)
        options.handler = (e) =>
            openDataFormDialog(
                e,
                'edit',
                options.viewModel,
                e.context.component.injector
            );
    if (!options.action)
        options.action = { name: 'edit', text: 'Edit', icon: 'edit' };

    return actionDialog(options);
}

export function ViewActionDialog<T>(
    options: DataListActionWithViewModel<T>
): DataListAction<any> {
    if (!options.viewModel)
        throw new Error('ViewActionDialog ViewModel is required');
    if (!options.handler)
        options.handler = (e) =>
            openDataFormDialog(
                e,
                'view',
                options.viewModel,
                e.context.component.injector
            );
    if (!options.action)
        options.action = { name: 'view', text: 'Details', icon: 'visibility' };

    return actionDialog(options);
}

export function DeleteAction<T>(
    options?: Partial<DataListAction<T>>
): DataListAction<any> {
    options ??= {};
    if (!options.handler) options.handler = (e) => onDelete(e);
    if (!options.action)
        options.action = {
            name: 'delete',
            text: 'Delete',
            icon: 'delete',
            menu: true,
        };

    return { action: options.action, handler: options.handler };
}

async function onDelete(e: ActionEvent<any, DataListViewModelActionContext>) {
    const items = e.data;
    const injector = e.context.component.injector;
    const confirm = injector.get(ConfirmService);
    const confirmRes = await confirm.openWarning({
        title: 'Delete',
        confirmText: `Are you sure you want to delete this item${
            items.length > 1 ? 's' : ''
        }?`,
        yes: 'Yes, delete',
        no: 'No, cancel',
        yesColor: 'warn',
    });
    if (!confirmRes) return;

    const ds = injector.get(DataService);
    const path = e.context.component.dataTable.adapter.dataSource['path'];
    const deleteTasks = items.map((item) => ds.delete(`/${path}/${item._id}`));
    const report = await Promise.allSettled(deleteTasks);
    const failed = report.filter((x) => x.status === 'rejected');
    if (failed.length > 0) {
        console.error('Failed to delete items', failed);
    }
    await e.context.component.refreshData();
}

async function getValue(path: string, ds: DataService) {
    const res = await firstValueFrom(
        ds.get<{ _id: string }[]>(path).pipe(map((x) => x.data?.[0]))
    );
    return res;
}

async function openDataFormDialog(
    e: ActionEvent,
    action: string,
    formViewModel: any,
    injector: Injector
) {
    const ds = injector.get(DataService);
    if (!formViewModel) throw new Error('formViewModel is required');

    const formViewModelCls = isNonClassFunction(formViewModel)
        ? (formViewModel as Function)(e)
        : formViewModel;

    const path = e.context.component.dataTable.adapter.dataSource['path'];
    const value = await (action === 'create'
        ? new formViewModelCls()
        : getValue(`${path}/${e.data?.[0]._id}`, ds));

    const dialog = injector.get(DialogService);

    const res = await firstValueFrom(
        dialog
            .openDialog(DataFormWithViewModelComponent, {
                title: toTitleCase(`${action}`),
                width: '100%',
                maxWidth: '800px',
                inputs: {
                    viewModel: formViewModelCls,
                    value,
                },
            })
            .afterClosed()
    );
    if (!res) return;
    await e.context.component.refreshData();
}

export function provideHeaderActions(options: { createViewModel?: any }) {
    const actions = [];
    if (options.createViewModel)
        actions.push(
            CreateActionDialog({ viewModel: options.createViewModel })
        );
    actions.push(
        DeleteAction({
            action: (items: any[]) => {
                return items.length === 0
                    ? undefined
                    : {
                          name: 'delete',
                          icon: 'delete_outline',
                          text: 'Delete',
                          bulk: true,
                      };
            },
        })
    );
    return actions;
}
export function provideRowActions<T = any>(options: {
    createViewModel?: any;
    editViewModel?: any;
    detailsViewModel?: any;
}) {
    const actions = [];
    if (options.createViewModel)
        actions.push(
            CreateActionDialog({ viewModel: options.createViewModel })
        );
    if (options.editViewModel)
        actions.push(EditActionDialog({ viewModel: options.editViewModel }));
    if (options.detailsViewModel)
        actions.push(ViewActionDialog({ viewModel: options.detailsViewModel }));
    actions.push(DeleteAction());
    return actions;
}
