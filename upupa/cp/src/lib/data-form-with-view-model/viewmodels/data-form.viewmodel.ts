import { Injector } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ActionEvent } from '@upupa/common';
import { UpupaDialogComponent } from '@upupa/dialog';
import {
    DynamicFormComponent,
    DynamicFormOptions,
    DynamicFormOptionsMetaData,
    formScheme,
} from '@upupa/dynamic-form';
import { DataFormWithViewModelComponent } from '../data-form-with-view-model.component';

export type DataFormViewModelActionContext = {
    dialogRef?: MatDialogRef<
        UpupaDialogComponent<DataFormWithViewModelComponent>
    >;
    component?: DataFormWithViewModelComponent;
    dynamicForm?: DynamicFormComponent;
};
export interface DataFormViewModel {
    injector: Injector;
    component: any;
    inputs: DynamicFormOptionsMetaData;
    onSubmit(
        value: any,
        e: ActionEvent<any, DataFormViewModelActionContext>
    ): Promise<void> | void;
    validate?(
        value: any
    ):
        | Promise<null | Record<string, string | null>>
        | null
        | Record<string, string | null>;
    afterSubmit?(): Promise<void> | void;
}

type ApiDataFormViewModelHttpAction = 'post' | 'get' | 'put' | 'delete';
type ApiDataFormViewModelOptions = {
    path: string | ((value: any, ...args: any[]) => string);
    httpAction:
        | ApiDataFormViewModelHttpAction
        | ((value: any) => ApiDataFormViewModelHttpAction);
    valueToPayload?: (value: any) => any;
    validate?: (value: any) => Record<string, string | null>;
} & Omit<DynamicFormOptions, 'path'>;

const defaultApiDataFormViewModelOptions: ApiDataFormViewModelOptions = {
    httpAction: (value: any) => (value._id ? 'put' : 'post'),
    path: (value: any, params: Record<string, string>) =>
        params?.['collection'] + (params?.['id'] ? `/${params?.['id']}` : ''),
};
export function apiDataFormViewModel(
    options: Partial<ApiDataFormViewModelOptions> = defaultApiDataFormViewModelOptions
) {
    return function (target: any) {
        formScheme({
            ...defaultApiDataFormViewModelOptions,
            ...options,
        } as any)(target);
    };
}
