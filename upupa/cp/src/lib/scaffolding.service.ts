import { Inject, Injectable, Injector } from "@angular/core";
import { firstValueFrom, Observable, of } from "rxjs";
import {
    ScaffoldingScheme,
    DataFormResolverResult,
    DataListResolverResult,
    FormScaffoldingModel,
    ListScaffoldingModel,
    ScaffoldingModel,
    Scaffolder,
    IScaffolder
} from "../types";
import { SCAFFOLDING_SCHEME } from "./di.token";
import {
    ClientDataSource,
    DataAdapter,
    ServerDataSource,
    DataService,
    HttpServerDataSource,
    DataAdapterDescriptor,
} from "@upupa/data";
import {
    defaultFormActions,
    defaultListActions
} from "../defaults";

import { PathInfo, PathMatcher } from "@noah-ark/path-matcher";
import { DialogService, DialogServiceConfig } from "@upupa/common";
import { DataFormComponent } from "./data-form/data-form.component";
import { HttpClient } from "@angular/common/http";

@Injectable({ providedIn: "root" })
export class ScaffoldingService {
    matcher: PathMatcher<Scaffolder>;

    constructor(
        private injector: Injector,
        private dialog: DialogService,
        private data: DataService,
        @Inject(SCAFFOLDING_SCHEME) private scaffoldingScheme: ScaffoldingScheme
    ) {
        this.matcher = new PathMatcher<Scaffolder>(null);
        addPath(this.matcher, "/", this.scaffoldingScheme);
    }


    async scaffold(path: string, fallback?: Partial<ScaffoldingModel> & { type: "form" | "list" }, ...params: any[]) {

        const scaffolder: Scaffolder = this.matcher.get(path);
        if (!scaffolder) throw `NO SCAFFOLDER FOR PATH ${path}`;

        let promise: Promise<ScaffoldingModel> | ScaffoldingModel;

        if (scaffolder.type)
            promise = this.injector
                .get<IScaffolder<ScaffoldingModel>>(scaffolder.type)
                .scaffold(path, ...params);
        if (scaffolder.scaffold) promise = scaffolder.scaffold(path, ...params);

        const _model = await promise;

        if (fallback && fallback.type !== _model.type)
            throw "FALLBACK TYPE MUST BE EQUAL TO MATCHED TYPE";

        const model = { ...fallback, ..._model };

        switch (model.type) {
            case "form":
                model.actions ??= defaultFormActions;
                return this.scaffoldForm(path, model);
            case "list":
                model.actions ??= defaultListActions;
                return this.scaffoldList(path, model);
            default:
                throw "UNSUPPORTED SCAFOLDING TYPE";
        }
    }

    scaffoldForm(
        path: string,
        scaffoldingModel: FormScaffoldingModel
    ): Promise<DataFormResolverResult> {
        const formViewModel = scaffoldingModel.viewModel;
        return Promise.resolve({ path, formViewModel }) as Promise<DataFormResolverResult>;
    }

    scaffoldList(
        path: string,
        scaffoldingModel: ListScaffoldingModel
    ): Promise<DataListResolverResult> {
        const listViewModel = scaffoldingModel.viewModel;
        const pathInfo = PathInfo.parse(path, 1).path;
        listViewModel.actions ??= scaffoldingModel.actions ?? defaultListActions;
        const filter = (listViewModel.query?.() ?? []) as any[];
        const fObj = filter.reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
        let select = listViewModel.select ?? Object.keys(listViewModel.columns ?? {})
        if (typeof select === 'string') select = select.split(',').filter(s => s)
        select.push(...Object.getOwnPropertyNames(fObj))
        select = select.filter((s, i, a) => a.indexOf(s) === i)
        const dataAdapter = listViewModel.adapter
        let source = null
        if (dataAdapter?.type === 'server')
            source = new ServerDataSource<any>(this.data, `/v2/${pathInfo}`, select)
        else if (dataAdapter?.type === 'client')
            source = new ClientDataSource((dataAdapter as unknown as DataAdapterDescriptor<'client', any>).data)
        else if (dataAdapter?.type === 'http') {
            const { url, httpOptions } = dataAdapter as unknown as DataAdapterDescriptor<'http', any>
            source = new HttpServerDataSource(
                this.injector.get(HttpClient),
                url, httpOptions
            )
        }
        else throw 'UNSUPPORTED DATA ADAPTER TYPE'


        const options = Object.assign({}, listViewModel.adapter.options, { filter: { ...listViewModel.adapter.options?.filter, ...fObj } });
        options.page ??= { pageSize: 100 };
        const adapter = new DataAdapter(
            source,
            listViewModel.adapter.keyProperty,
            listViewModel.adapter.displayProperty,
            listViewModel.adapter.valueProperty,
            listViewModel.adapter.imageProperty,
            options
        );
        return Promise.resolve({ path, adapter, listViewModel }) as Promise<DataListResolverResult>;
    }

    async dialogForm<T = any>(path: string, dialogOptions?: DialogServiceConfig, ...params: any[]): Promise<T> {
        const data = await this.scaffold(path, undefined, ...params) as DataFormResolverResult;
        const { formViewModel } = data
        return firstValueFrom(this.dialog.openDialog(DataFormComponent, {
            ...dialogOptions,
            inputs: { ...dialogOptions.inputs, path, ...formViewModel }
        }).afterClosed())
    }
}


function addPath(
    matcher: PathMatcher<Scaffolder>,
    path: string,
    obj: Record<string, object>
) {
    const names = Object.getOwnPropertyNames(obj);
    const prefix = path === "/" ? "" : path;
    for (const prop of names) {
        const v = obj[prop] as any;
        matcher.add(`${prefix}/${prop}`, v);
        if ("type" in v) continue;
        addPath(matcher, `${prefix}/${prop}`, v);
    }
}