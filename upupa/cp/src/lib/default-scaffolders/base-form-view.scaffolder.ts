import { from, Observable, ReplaySubject } from 'rxjs';
import { ActionEvent } from '@upupa/common';
import { map, shareReplay, tap } from 'rxjs/operators';
import { DataResult, DataService } from '@upupa/data';
import { ScaffoldingService } from '../scaffolding.service';
import { IScaffolder, FormScaffoldingModel } from '../../types';
import { FormScheme, resolveFormViewmodelInputs } from '@upupa/dynamic-form';
import { resolvePath } from './resolve-scaffolder-path.func';
import { defaultFormActions } from '../../defaults';
import { inject } from '@angular/core';
import { ConfirmService } from '@upupa/dialog';

export class FormViewScaffolder<T>
    implements IScaffolder<FormScaffoldingModel>
{
    public scaffolder = inject(ScaffoldingService);
    public data = inject(DataService);
    public confirm = inject(ConfirmService);

    value: T;
    subject = new ReplaySubject<T>(1);

    create(): Promise<T> {
        return Promise.resolve({} as T);
    }

    async scheme(instance: T): Promise<FormScheme> {
        return Promise.resolve({});
    }

    async scaffold(
        path: string,
        ...params: any[]
    ): Promise<FormScaffoldingModel> {
        let view,
            collection = path;

        const { path: _path, view: _view } = resolvePath(path);
        view = _view;
        path = _path;
        collection =
            view !== 'edit'
                ? _path
                      .split('/')
                      .filter((s) => s)
                      .pop()
                : _path
                      .split('/')
                      .filter((s) => s)
                      .at(-2);

        const dfInputs = {}; // resolveFormViewmodelInputs(collection);

        const v = this.value$(path);

        return {
            type: 'form',
            viewModel: {
                ...dfInputs,
                actions: defaultFormActions.slice(),
                defaultSubmitOptions: { closeDialog: true },
                value$: v,
            },
        } as any;
    }

    value$(path: string): Observable<T> {
        const { path: _path, view } = resolvePath(path);

        const model$ =
            view === 'create'
                ? from(this.create())
                : this.data.get<DataResult<T>>(_path).pipe(
                      shareReplay(1),
                      map((x) => x.data?.[0] ?? ({} as T))
                  );

        return model$.pipe(tap((v) => (this.value = v)));
    }

    async defaultCreateArrayItemHandler(path: string, event: ActionEvent) {
        return await this.scaffolder.dialogForm(path, null, this.value);
    }

    async defaultEditArrayItemHandler(path: string, event: ActionEvent) {
        return await this.scaffolder.dialogForm(path, null, event.data[0]);
    }

    async defaultRemoveArrayItemsHandler(event: ActionEvent) {
        return await this.confirm.open();
    }
}
