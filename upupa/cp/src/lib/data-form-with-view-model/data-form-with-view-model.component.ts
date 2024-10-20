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
    runInInjectionContext,
} from '@angular/core';
import {
    DynamicFormComponent,
    DynamicFormModule,
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
import { MatBtnComponent } from '@upupa/mat-btn';

@Component({
    selector: 'cp-data-form-with-view-model',
    standalone: true,
    imports: [MatBtnComponent, DynamicFormModule],
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
        this._formChangesSub = dForm
            .formElement()
            .valueChanges.pipe(
                debounceTime(100),
                takeUntilDestroyed(this.destroyRef),
                map((v) => (dForm.formElement().valid ? 'VALID' : 'INVALID'))
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

    private readonly destroyRef = inject(DestroyRef);
    private readonly injector = inject(Injector);

    loading = signal(false);

    viewmodel = input.required<any>(); //DataFormViewModel;
    value = input<any>(null);
    formValue = computed(() => {
        if (this.value !== undefined) return this.value;
        const vm = this.viewmodel();
        return new vm();
    });
    inputs = computed(() => {
        const vm = this.viewmodel;
        const inputs = resolveDynamicFormOptionsFor(vm);
        return inputs;
    });
    _model = computed(() => {
        const inputs = this.inputs();
        const vm = this.viewmodel as any;
        let model = undefined as any;
        runInInjectionContext(this.injector, () => {
            model = new vm();
            console.log('model', model);

            model.injector = this.injector;
            model.component = this;
            model.dynamicForm = this.form;
            model.inputs = inputs;
        });
        return model;
    });

    actions = computed(() => {
        const { onSubmitAction, actions } = this.inputs();
        const formActions = actions ?? [];
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

    async submit() {
        const vm = this._model();
        if (!vm) throw new Error('ViewModel not initialized');
        const submitAction = this.actions()[0];
        if (!vm[submitAction.handlerName])
            throw new Error(
                `Handler ${submitAction.handlerName} not found in ViewModel`
            );

        const formEl = this.form?.formElement;
        if (!formEl) return;
        if (this.form.invalid && this.form.touched)
            return this.form.scrollToError();

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
    }

    async onAction(e: ActionEvent): Promise<void> {
        if (e.action.name === 'onSubmit') return this.submit();
        const { handlerName } = e.action as any; //DataFormActionDescriptor;
        const vm = this._model();

        if (!vm) throw new Error('ViewModel not initialized');
        if (!vm[handlerName])
            throw new Error(`Handler ${handlerName} not found in ViewModel`);

        await vm[handlerName]({
            ...e,
            context: { ...e.context, component: this, dynamicForm: this.form },
        });
    }
}
