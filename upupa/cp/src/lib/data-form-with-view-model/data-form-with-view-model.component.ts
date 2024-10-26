import {
    Component,
    inject,
    DestroyRef,
    signal,
    computed,
    input,
    Injector,
    runInInjectionContext,
    model,
    viewChild,
} from '@angular/core';
import {
    DynamicFormComponent,
    DynamicFormModule,
    resolveFormViewmodelInputs,
} from '@upupa/dynamic-form';
import { MatDialogRef } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { UpupaDialogComponent, UpupaDialogPortal } from '@upupa/dialog';
import { MatBtnComponent } from '@upupa/mat-btn';
import { Class } from '../helpers';
import { CommonModule } from '@angular/common';

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
export class DataFormWithViewModelComponent<T = any>
    implements UpupaDialogPortal<DataFormWithViewModelComponent<T>>
{
    private readonly destroyRef = inject(DestroyRef);
    private readonly injector = inject(Injector);

    form = viewChild(DynamicFormComponent);

    dialogRef?: MatDialogRef<
        UpupaDialogComponent<DataFormWithViewModelComponent>
    >;

    loading = signal(false);

    viewmodel = input.required<Class>();
    value = model<T>();

    // dynamic form inputs
    dynamicFormInputs = computed(() => {
        const inputs = resolveFormViewmodelInputs(this.viewmodel());
        return inputs;
    });
    fields = computed(() => this.dynamicFormInputs().fields);
    name = computed(
        () => this.dynamicFormInputs().name ?? Date.now().toString()
    );
    preventDirtyUnload = computed(
        () => this.dynamicFormInputs().preventDirtyUnload === true
    );
    recaptcha = computed(() => this.dynamicFormInputs().recaptcha);
    theme = computed(() => this.dynamicFormInputs().theme);
    conditions = computed(() => this.dynamicFormInputs().conditions);

    // form actions
    actions = computed(() => {
        const { onSubmitAction, actions } = this.dynamicFormInputs();
        const formActions = actions ?? [];
        return [onSubmitAction, ...formActions].filter((x) => x);
    });

    // private instance = signal<any>(null);
    ngOnChanges(changes) {
        const type = this.viewmodel();
        if (changes['viewmodel']) {
            runInInjectionContext(this.injector, () => {
                if (this.value() instanceof type) return;
                const instance = new type();
                this.value.set(instance);
            });
        }
    }

    onValueChange(v: any) {
        console.log('onValueChange', v);
    }

    async onSubmit() {
        const vm = this.value();
        vm['onSubmit']?.();
    }

    // async onAction(e: ActionEvent): Promise<void> {
    //     if (e.action.name === 'onSubmit')
    //         return runInInjectionContext(this.injector, () => {
    //             this.onSubmit();
    //         });

    //     const { handlerName } = e.action as any; //DataFormActionDescriptor;
    //     const vm = this.instance();

    //     if (!vm) throw new Error('ViewModel not initialized');
    //     if (!vm[handlerName])
    //         throw new Error(`Handler ${handlerName} not found in ViewModel`);

    //     await vm[handlerName]({
    //         ...e,
    //         context: { ...e.context, component: this, dynamicForm: this.form },
    //     });
    // }
}
