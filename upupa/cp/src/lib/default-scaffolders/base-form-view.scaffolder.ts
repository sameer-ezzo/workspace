import { from, ReplaySubject } from "rxjs";
import { ActionDescriptor, ActionEvent, ConfirmService } from "@upupa/common";
import { shareReplay, tap } from "rxjs/operators";
import { DataService } from "@upupa/data";
import { ScaffoldingService } from "../scaffolding.service";
import { IScaffolder, FormScaffoldingModel } from "../../types";
import { resolveFormSchemeOf, FormScheme, resolveFormValueFactoryOf } from "@upupa/dynamic-form";
import { resolvePath } from "./resolve-scaffolder-path.func";

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

    scaffold(path: string, ...params: any[]): Promise<FormScaffoldingModel> {
        const { path: _path, view } = resolvePath(path)
        const collection = view !== 'edit' ? _path.split('/').filter(s => s).pop() : _path.split('/').filter(s => s).at(-2);

        const scheme = resolveFormSchemeOf(collection)
        if (view === 'create') {
            const modelFactory = resolveFormValueFactoryOf(collection)
            if (modelFactory) this.create = modelFactory
        }

        return Promise.resolve({
            type: 'form',
            viewModel: {
                scheme: scheme,
                value$: this.value$(path),
                defaultSubmitOptions: { closeDialog: true },
            }
        } as FormScaffoldingModel);
    }



    value$(path: string) {
        const { path: _path, view } = resolvePath(path);
        const model$ = (view === 'create' ? from(this.create()) : this.data.get<T>(_path)).pipe(tap(v => this.value = v));
        return model$.pipe(shareReplay(1));
    }


    async defaultCreateArrayItemHandler(path: string, event: ActionEvent) {
        const result = await this.scaffolder.dialogForm(path, null, this.value);
        return result;
    };

    async defaultEditArrayItemHandler(path: string, event: ActionEvent) {
        const result = await this.scaffolder.dialogForm(path, null, event.data[0]);
        return result;
    };

    async defaultRemoveArrayItemsHandler(event: ActionEvent) {
        return await this.confirm.open();
    };
}
