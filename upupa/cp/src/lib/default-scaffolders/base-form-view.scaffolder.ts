import { from, Observable, ReplaySubject } from "rxjs";
import { ActionEvent, ConfirmService } from "@upupa/common";
import { map, shareReplay, tap } from "rxjs/operators";
import { DataResult, DataService } from "@upupa/data";
import { ScaffoldingService } from "../scaffolding.service";
import { IScaffolder, FormScaffoldingModel } from "../../types";
import { FormScheme, resolveDynamicFormInputsFor } from "@upupa/dynamic-form";
import { resolvePath } from "./resolve-scaffolder-path.func";
import { defaultFormActions } from "../../defaults";
import { inject } from "@angular/core";

export class FormViewScaffolder<T> implements IScaffolder<FormScaffoldingModel> {

    public scaffolder = inject(ScaffoldingService)
    public data = inject(DataService)
    public confirm = inject(ConfirmService)

    value: T;
    subject = new ReplaySubject<T>(1);


    create(): Promise<T> {
        return Promise.resolve({} as T);
    }

    async scheme(instance: T): Promise<FormScheme> {
        return Promise.resolve({})
    }

    async scaffold(path: string, ...params: any[]): Promise<FormScaffoldingModel> {
        const { path: _path, view } = resolvePath(path)
        const collection = view !== 'edit' ? _path.split('/').filter(s => s).pop() : _path.split('/').filter(s => s).at(-2);

        const dfInputs = resolveDynamicFormInputsFor(collection)

        if (view === 'create') {
            if (dfInputs.initialValueFactory) this.create = dfInputs.initialValueFactory
        }

        const v = this.value$(path)

        return {
            type: 'form',
            viewModel: {
                ...dfInputs,
                actions: defaultFormActions.slice(),
                defaultSubmitOptions: { closeDialog: true },
                value$: v,
            }
        } as FormScaffoldingModel;
    }



    value$(path: string): Observable<T> {
        const { path: _path, view } = resolvePath(path);

        const model$ = view === 'create' ? from(this.create()) :
            this.data.get<DataResult<T>>(_path).pipe(
                shareReplay(1),
                map(x => x.data?.[0] ?? {} as T),
                tap(v => console.log(v))
            )

        return model$.pipe(tap(v => this.value = v));
    }


    async defaultCreateArrayItemHandler(path: string, event: ActionEvent) {
        return await this.scaffolder.dialogForm(path, null, this.value);
    };

    async defaultEditArrayItemHandler(path: string, event: ActionEvent) {
        return await this.scaffolder.dialogForm(path, null, event.data[0]);
    };

    async defaultRemoveArrayItemsHandler(event: ActionEvent) {
        return await this.confirm.open();
    };
}
