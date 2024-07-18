import { FactorySansProvider } from "@angular/core";
import { FormScheme } from "@upupa/dynamic-form";
import { ColumnDescriptor } from "@upupa/table"
import { IScaffolder, ListScaffoldingModel, DataListViewModel, DataListFilterForm, DataFormViewModel, FormScaffoldingModel } from "../../types";
import { SideBarGroup, SideBarItem } from "../cp-layout/side-bar-group-item";

export type LookUpDescriptor = { from: string, as: string, localField: string, foreignField: string, single: boolean }
export type ColumnOptions = ColumnDescriptor & { displayPath?: string, order?: number, includeInDataSelect?: boolean, lookup?: LookUpDescriptor }


export type CPCommandPosition = 'sidebar' | 'user-menu' | 'toolbar';
export type ViewMetaOptions = {
    positions?: CPCommandPosition[],
    text?: string
    icon?: string
    group?: string
}

export type CpLayoutOptions = {
    [key in CPCommandPosition]: (SideBarGroup | SideBarItem)[];
};

type ScaffolderOption = { scaffolder?: IScaffolder<ListScaffoldingModel> | any };
export type QueryFactoryProvider = FactorySansProvider & { useFactory: (...deps: any[]) => Iterable<readonly [string, string]> }
export type QueryType = ((...deps: any[]) => Iterable<readonly [string, string | number]>) | QueryFactoryProvider;

export type ListViewModelOptions = Partial<Omit<DataListViewModel, 'filterForm' | 'query' | 'queryParams'>> & {
    filterForm?: Partial<Omit<DataListFilterForm, 'fields'>> & { fields: FormScheme | string },
    query?: QueryType,
    queryParams?: QueryType,
};

export type ListViewOptions = ViewMetaOptions & (ScaffolderOption | ListViewModelOptions);
export type CreateFormOptions = Partial<DataFormViewModel> & { scaffolder?: IScaffolder<FormScaffoldingModel> | any, }
export type EditFormOptions = Partial<{
    selector: `:${string}`,
    scaffolder?: IScaffolder<FormScaffoldingModel> | any,
    options: Partial<DataFormViewModel> & {}
}>
export type ViewFormOptions = EditFormOptions;

export type ModelSchemeRouteOptions = {
    listView?: ListViewOptions,
    createForm?: CreateFormOptions,
    editForm?: EditFormOptions,
    viewForm?: EditFormOptions
}


export * from './column.decorator';
export * from './scheme.router.decorator';