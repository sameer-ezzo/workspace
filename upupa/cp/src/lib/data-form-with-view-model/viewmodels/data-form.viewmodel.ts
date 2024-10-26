import { Injector } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ActionEvent } from '@upupa/common';
import { UpupaDialogComponent } from '@upupa/dialog';
import {
    DynamicFormComponent,
    DynamicFormOptionsMetaData,
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
