import { Component, inject, DestroyRef, signal, computed, input, Injector, runInInjectionContext, model, viewChild, SimpleChanges } from '@angular/core';
import { DynamicFormComponent, DynamicFormModule, resolveFormViewmodelInputs } from '@upupa/dynamic-form';
import { MatDialogRef } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { UpupaDialogComponent, UpupaDialogPortal } from '@upupa/dialog';
import { MatBtnComponent } from '@upupa/mat-btn';
import { Class } from '../helpers';
import { CommonModule } from '@angular/common';
import { ActionEvent } from '@upupa/common';

@Component({
    selector: 'cp-data-form-with-view-model',
    standalone: true,
    imports: [CommonModule, MatBtnComponent, DynamicFormModule],
    templateUrl: './data-form-with-view-model.component.html',
    styleUrls: ['./data-form-with-view-model.component.scss'],
    providers: [
        {
            provide: DynamicFormComponent,
            useFactory: (self: DataFormWithViewModelComponent) => self.form(),
            deps: [DataFormWithViewModelComponent],
        },
    ],
})
export class DataFormWithViewModelComponent<T = any> implements UpupaDialogPortal<DataFormWithViewModelComponent<T>> {
    private readonly injector = inject(Injector);

    form = viewChild(DynamicFormComponent);

    dialogRef?: MatDialogRef<UpupaDialogComponent<DataFormWithViewModelComponent>>;

    loading = signal(false);

    viewmodel = input.required<Class>();
    value = model<T>();

    // dynamic form inputs
    dynamicFormInputs = computed(() => {
        const fields = resolveFormViewmodelInputs(this.viewmodel());
        return fields;
    });
    fields = computed(() => this.dynamicFormInputs().fields);
    name = computed(() => this.dynamicFormInputs().name ?? Date.now().toString());
    preventDirtyUnload = computed(() => this.dynamicFormInputs().preventDirtyUnload === true);

    theme = computed(() => this.dynamicFormInputs().theme);
    conditions = computed(() => this.dynamicFormInputs().conditions);

    // form actions
    actions = computed(() => {
        const { onSubmitAction, actions } = this.dynamicFormInputs();
        const formActions = actions ?? [];
        return [onSubmitAction, ...formActions].filter((x) => x);
    });

    // private instance = signal<any>(null);
    ngOnChanges(changes: SimpleChanges) {
        const vmType = this.viewmodel();
        if (changes['viewmodel']) {
            runInInjectionContext(this.injector, () => {
                const v = this.value();
                if (v instanceof vmType) return;
                const instance = new vmType();
                this.value.set(instance);
            });
        }
    }

    onValueChange(v: any) {
        // console.log("onValueChange", v);
    }

    onSubmit() {
        const vm = this.value();
        const prototype = Object.getPrototypeOf(vm);
        runInInjectionContext(this.injector, async () => {
            await prototype['onSubmit']();
            if (prototype['afterSubmit']) prototype['afterSubmit']?.();
        });
    }

    async onAction(e: ActionEvent): Promise<void> {
        const vm = this.value();
        const prototype = Object.getPrototypeOf(vm);
        let { handlerName } = e.action as any;
        if (!handlerName && e.action.type === 'submit') handlerName = 'onSubmit';
        if (!prototype[handlerName]) throw new Error(`Handler ${handlerName} not found in ViewModel`);

        if (handlerName === 'onSubmit') return this.form().ngForm().ngSubmit.emit();
        return runInInjectionContext(this.injector, async () => {
            await prototype[handlerName]();
        });
    }
}
