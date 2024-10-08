import { Injector } from '@angular/core';
import { ActionEvent } from '@upupa/common';
import { DataService } from '@upupa/data';
import { SnackBarService } from '@upupa/dialog';
import {
  DynamicFormOptionsMetaData,
  submitAction,
  formAction,
} from '@upupa/dynamic-form';
import {
  DataFormViewModel,
  DataFormViewModelActionContext,
} from './data-form.viewmodel';

export class ApiDataFormViewModel implements DataFormViewModel {
  injector!: Injector;
  component: any;
  inputs!: DynamicFormOptionsMetaData;

  // @submitAction({ text: 'Submit', color: 'primary' })
  async onSubmit(value: any, e: ActionEvent) {
    const { path } = this.inputs;
    if (!path)
      throw new Error(
        `Path is required for submitting data form ${
          (this as any).constructor.name
        }`
      );

    const _path =
      typeof path === 'function'
        ? (path as Function)(value)
        : path + (value._id ? `/${value._id}` : '');
    const httpAction =
      'httpAction' in this.inputs
        ? (this.inputs.httpAction as Function)(value)
        : 'post';
    const validateFn = (
      'validate' in this.inputs ? this.inputs.validate : (value: any) => null
    ) as (value: any) => Record<string, string | null>;

    const validationResults = validateFn(value);
    if (validationResults)
      return this.handleSubmitValidationErrors(validationResults);

    const ds = this.injector.get(DataService);
    const valueToPayload = (
      'valueToPayload' in this.inputs
        ? this.inputs.valueToPayload
        : (x: any) => Object.assign({}, x)
    ) as (value: any) => any;

    const payload = valueToPayload(value);
    const result = await ds[httpAction](_path, payload);

    this.handleSubmitSuccess(result, e);
  }

  handleSubmitSuccess(
    result: any,
    e: ActionEvent<any, DataFormViewModelActionContext>
  ): void {
    
    if (e.context.dialogRef) e.context.dialogRef.close(result);
  }

  handleSubmitValidationErrors(
    validationResults: Record<string, string | null>
  ): void {
    const errors = Object.values(validationResults ?? {}).filter((x) => x);
    if (!errors.length) return;
    const snack = this.injector.get(SnackBarService);
    snack.openFailed(errors.join('\n'));
    // reflect errors in the form and focus on the first invalid input
    // todo: implement errors input in the dynamic form
  }

  // @formAction({ text: 'Discard' })
  onDiscard(e: ActionEvent) {
    e.context.dialogRef?.close();
  }
}
