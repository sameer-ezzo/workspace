import {
  Component,
  ViewChild,
  inject,
  DestroyRef,
  signal,
  computed,
  input,
  Injector,
  effect,
} from '@angular/core';
import {
  DynamicFormComponent,
  resolveDynamicFormOptionsFor,
} from '@upupa/dynamic-form';
import { debounceTime, map } from 'rxjs/operators';
import { ActionEvent } from '@upupa/common';
import { DataService } from '@upupa/data';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialogRef } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  SnackBarService,
  UpupaDialogComponent,
  UpupaDialogPortal,
} from '@upupa/dialog';

@Component({
  selector: 'cp-data-form-with-view-model',
  templateUrl: './data-form-with-view-model.component.html',
  styleUrls: ['./data-form-with-view-model.component.scss'],
})
export class DataFormWithViewModelComponent<T = any>
  implements UpupaDialogPortal<DataFormWithViewModelComponent<T>>
{
  private _formChangesSub: Subscription;
  private _form: DynamicFormComponent;
  @ViewChild('dynForm')
  public get form(): DynamicFormComponent {
    return this._form;
  }
  public set form(dForm: DynamicFormComponent) {
    this._form = dForm;
    this._formChangesSub?.unsubscribe();
    if (!this.form) return;
    this._formChangesSub = dForm.formElement.valueChanges
      .pipe(
        debounceTime(100),
        takeUntilDestroyed(this.destroyRef),
        map((v) => (dForm.formElement.valid ? 'VALID' : 'INVALID'))
      )
      .subscribe((status) => {
        // this.dialogActions.set(
        // this._actions.map((a) =>
        //   a.type === 'submit' ? { ...a, disabled: status !== 'VALID' } : a
        // )
        // );
      });
  }

  dialogRef?: MatDialogRef<
    UpupaDialogComponent<DataFormWithViewModelComponent>
  >;
  dialogActions = signal([]);

  private readonly ds = inject(DataService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snack = inject(SnackBarService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  loading = signal(false);

  viewModel = input.required<any>(); //DataFormViewModel;
  value = input<any>(null);
  formValue = computed(() => {
    if (this.value !== undefined) return this.value;
    const viewModel = this.viewModel();
    return new viewModel();
  });
  inputs = computed(() => {
    const viewModel = this.viewModel;
    const inputs = resolveDynamicFormOptionsFor(viewModel);
    return inputs;
  });
  vm = computed(() => {
    const inputs = this.inputs();
    const viewModel = this.viewModel as any;
    const vm = new viewModel();
    vm.injector = this.injector;
    vm.component = this;
    vm.dynamicForm = this.form;
    vm.inputs = inputs;
    console.log(inputs);

    return vm;
  });

  actions = computed(() => {
    const { onSubmitAction, actions } = this.inputs();
    const formActions = actions ?? [];
    console.log('Form Actions', formActions);
    return [onSubmitAction, ...formActions];
  });

  constructor() {
    effect(
      () => {
        const actions = this.actions();
        if (this.dialogRef) {
          this.dialogActions.set(actions);
        }
      },
      { allowSignalWrites: true }
    );
  }
  // setLoading(loading: boolean) {
  //   this.loading.set(loading);
  //   this.dialogActions.set(
  //     this._actions.map((a) =>
  //       a.type === 'submit' ? { ...a, disabled: loading } : a,
  //     ),
  //   );
  // }

  async submit() {
    const vm = this.vm();
    if (!vm) throw new Error('ViewModel not initialized');
    const submitAction = this.actions()[0];
    if (!vm[submitAction.handlerName])
      throw new Error(
        `Handler ${submitAction.handlerName} not found in ViewModel`
      );
      
    const formEl = this.form?.formElement;
    if (!formEl) return;
    if (this.form.invalid && this.form.touched) return this.form.scrollToError();

    const value = this.form.value;
    const action = this.actions()[0];
    await vm[submitAction.handlerName](value, {
      action,
      data: value,
      context: {
        data: value,
        dialogRef: this.dialogRef,
        component: this,
        dynamicForm: this.form,
      },
    });
    // this.setLoading(true);

    // if (this.valueToRecord) {
    //   try {
    //     value = await this.valueToRecord(this.form, value);
    //   } catch (error) {
    //     this.handleSubmitError(error);
    //   } finally {
    //     this.setLoading(false);
    //   }
    // }

    // let submitResult: FormSubmitResult;
    // if (this.onSubmit) {
    //   try {
    //     submitResult = await this.onSubmit(this.path, this.form.value);
    //   } catch (error) {
    //     this.handleSubmitError(error);
    //   } finally {
    //     this.setLoading(false);
    //   }
    // } else if (this.onSubmit === undefined) {
    //   const pathInfo = PathInfo.parse(this.path, 1);
    //   let res = null as any;
    //   if (value[this.idPath]) {
    //     const p =
    //       pathInfo.segments.length === 1
    //         ? pathInfo.path + '/' + value[this.idPath]
    //         : pathInfo.path;
    //     const v = Object.assign({}, value);
    //     delete value[this.idPath];
    //     try {
    //       res = await this.ds.put(p, v);
    //     } catch (error) {
    //       this.handleSubmitError(error);
    //     } finally {
    //       this.setLoading(false);
    //     }
    //   } else {
    //     try {
    //       res = await this.ds.post(pathInfo.path, value);
    //     } catch (error) {
    //       this.handleSubmitError(error);
    //     } finally {
    //       this.setLoading(false);
    //     }
    //   }
    // }

    // submitResult ??= this.defaultSubmitOptions;
    // if (submitResult) {
    //   try {
    //     await this.handleSubmit(submitResult, value);
    //   } catch (error) {
    //     this.handleSubmitError(error);
    //   } finally {
    //     this.setLoading(false);
    //   }
    // }
  }
  // handleSubmitError(error: any) {
  //   const e = error.error ?? error;
  //   this.snack.openFailed(e.message ?? e.code ?? e.status);
  // }

  // async handleSubmit(submissionResult: FormSubmitResult, value: any) {
  //   if (submissionResult.successMessage)
  //     this.snack.openSuccess(submissionResult.successMessage);
  //   if (submissionResult.redirect)
  //     this.router.navigateByUrl(submissionResult.redirect);
  //   if (submissionResult.closeDialog) this.dialogRef.close(value);
  // }

  async onAction(e: ActionEvent): Promise<void> {
    // const dialogRef = e.context?.dialogRef;
    // if (e.action.type === 'submit') {
    //   try {
    //     await this.submit(this.form.value);
    //     dialogRef.close(this.form.value);
    //   } catch (error) {
    //     console.error(error);
    //   }
    // } else dialogRef.close();
    if (e.action.name === 'onSubmit') return this.submit();
    const { handlerName } = e.action as any; //DataFormActionDescriptor;
    const vm = this.vm();

    if (!vm) throw new Error('ViewModel not initialized');
    if (!vm[handlerName])
      throw new Error(`Handler ${handlerName} not found in ViewModel`);

    await vm[handlerName]({
      ...e,
      context: { ...e.context, component: this, dynamicForm: this.form },
    });
  }
}
