import { Component, inject, DestroyRef, signal, computed, input, Injector, runInInjectionContext, model, viewChild, SimpleChanges } from '@angular/core';
import { DynamicFormComponent, DynamicFormModule, FormViewModelMirror, reflectFormViewModelType } from '@upupa/dynamic-form';
import { MatDialogRef } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { UpupaDialogComponent, UpupaDialogPortal } from '@upupa/dialog';
import { MatBtnComponent } from '@upupa/mat-btn';
import { CommonModule } from '@angular/common';
import { ActionEvent, deepAssign } from '@upupa/common';
import { Class } from '@noah-ark/common';

@Component({
    selector: 'cp-data-form-with-view-model',
    standalone: true,
    imports: [CommonModule, MatBtnComponent, DynamicFormModule],
    templateUrl: './data-form-with-view-model.component.html',
    styleUrls: ['./data-form-with-view-model.component.scss'],
    providers: [
        {
            provide: DynamicFormComponent,
            useFactory: (self: DataFormWithViewModelComponent) => self.dynamicFormEl(),
            deps: [DataFormWithViewModelComponent],
        },
    ],
})
export class DataFormWithViewModelComponent<T = any> implements UpupaDialogPortal<DataFormWithViewModelComponent<T>> {
    private readonly injector = inject(Injector);

    dynamicFormEl = viewChild(DynamicFormComponent);
    ngForm = computed(() => this.dynamicFormEl().ngForm());
    dialogRef?: MatDialogRef<UpupaDialogComponent<DataFormWithViewModelComponent>>;

    loading = signal(false);

    viewModel = input.required<FormViewModelMirror, Class | FormViewModelMirror>({
        transform: (v) => {
            if (typeof v === 'function') return reflectFormViewModelType(v);
            return v;
        },
    });

    value = model<T>();

    // form actions
    actions = computed(() => {
        const { onSubmitAction, actions } = this.viewModel();
        const formActions = actions ?? [];
        return [onSubmitAction, ...formActions].filter((x) => x);
    });

    // private instance = signal<any>(null);
    ngOnChanges(changes: SimpleChanges) {
        const v = this.value();
        const type = this.viewModel().viewModelType;

        if (!(v instanceof type)) {
            let instance: any;
            runInInjectionContext(this.injector, () => {
                instance = new type();
            });
            deepAssign(instance, v);
            this.value.set(instance);
        }
    }

    onValueChange(v: any) {
        // console.log("onValueChange", v);
    }

    onSubmit() {
        const vm = this.value();
        const prototype = vm; // Object.getPrototypeOf(vm);
        runInInjectionContext(this.injector, async () => {
            await prototype['onSubmit']();
            if (prototype['afterSubmit']) prototype['afterSubmit']?.();
        });
    }

    async onAction(e: ActionEvent): Promise<void> {
        const vm = this.value();
        const prototype = vm; // Object.getPrototypeOf(vm);
        let { handlerName } = e.action as any;
        if (!handlerName && e.action.type === 'submit') handlerName = 'onSubmit';
        if (!prototype[handlerName]) throw new Error(`Handler ${handlerName} not found in ViewModel`);

        if (handlerName === 'onSubmit') return this.dynamicFormEl().ngForm().ngSubmit.emit();
        return runInInjectionContext(this.injector, async () => {
            await prototype[handlerName]();
        });
    }
}
