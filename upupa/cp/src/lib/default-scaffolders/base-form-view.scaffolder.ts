import { from, Observable, ReplaySubject } from "rxjs";
import { ActionDescriptor, ActionEvent, ConfirmService } from "@upupa/common";
import { share, shareReplay, tap } from "rxjs/operators";
import { DataService } from "@upupa/data";
import { ScaffoldingService } from "../scaffolding.service";
import { IScaffolder, FormScaffoldingModel } from "../../types";
import { resolveFormSchemeOf, FormScheme, resolveFormValueFactoryOf, resolveDynamicFormInputsFor } from "@upupa/dynamic-form";
import { resolvePath } from "./resolve-scaffolder-path.func";
import { defaultFormActions } from "../../defaults";

// defaultListActions: ActionDescriptor[] = [
//     { variant: 'icon', name: 'edit', icon: 'edit', menu: false },
//     { position: 'menu', name: 'delete', icon: 'delete_outline', text: 'Delete', menu: true },
//     { position: 'bulk', name: 'delete', icon: 'delete_outline', text: 'Delete', menu: true, bulk: true },
//     { position: 'header', name: 'create', icon: 'add_circle_outline', text: 'Create' }
// ];
export class FormViewScaffolder<T> implements IScaffolder<FormScaffoldingModel> {

    constructor(public scaffolder: ScaffoldingService, public data: DataService, public confirm: ConfirmService) { }

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
        // v.subscribe() // for some reason, this is necessary to get the value to be set because the data service will clear the value if there are no subscribers

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
        console.log('value$', _path, view);

        const model$ = (view === 'create' ? from(this.create()) : this.data.get<T>(_path).pipe(shareReplay(1)));
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
