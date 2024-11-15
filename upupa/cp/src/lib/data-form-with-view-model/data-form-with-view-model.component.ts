import { Component, inject, DestroyRef, signal, computed, input, Injector, runInInjectionContext, model, viewChild, SimpleChanges, forwardRef, output } from "@angular/core";
import { DynamicFormComponent, DynamicFormModule, FORM_GRAPH, FormViewModelMirror, reflectFormViewModelType } from "@upupa/dynamic-form";
import { MatDialogRef } from "@angular/material/dialog";
import { Subscription } from "rxjs";
import { UpupaDialogComponent, UpupaDialogPortal } from "@upupa/dialog";
import { MatBtnComponent } from "@upupa/mat-btn";
import { CommonModule } from "@angular/common";
import { ActionEvent, deepAssign } from "@upupa/common";
import { Class, delay } from "@noah-ark/common";
import { FormGroup, FormGroupDirective, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";

@Component({
    selector: "cp-data-form-with-view-model",
    standalone: true,
    imports: [CommonModule, MatBtnComponent, DynamicFormModule, ReactiveFormsModule, MatProgressSpinnerModule],
    templateUrl: "./data-form-with-view-model.component.html",
    styleUrls: ["./data-form-with-view-model.component.scss"],
    providers: [
        {
            provide: DynamicFormComponent,
            useFactory: (self: DataFormWithViewModelComponent) => self.dynamicFormEl(),
            deps: [DataFormWithViewModelComponent],
        },
        {
            provide: FORM_GRAPH,
            useFactory: (self: DataFormWithViewModelComponent) => self.dynamicFormEl().graph(),
            deps: [DataFormWithViewModelComponent],
        },
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => DataFormWithViewModelComponent),
            multi: true,
        },
    ],
})
export class DataFormWithViewModelComponent<T = any> implements UpupaDialogPortal<DataFormWithViewModelComponent<T>> {
    private readonly injector = inject(Injector);

    dynamicFormEl = viewChild(DynamicFormComponent);
    form = input<FormGroup, FormGroup>(new FormGroup({}), { transform: (v) => v ?? new FormGroup({}) });
    dialogRef?: MatDialogRef<UpupaDialogComponent<DataFormWithViewModelComponent>> = inject(MatDialogRef, { optional: true });

    loading = signal(false);

    viewModel = input.required<FormViewModelMirror, Class | FormViewModelMirror>({
        transform: (v) => {
            if (typeof v === "function") return reflectFormViewModelType(v);
            return v;
        },
    });

    value = model<T>();

    // form actions

    submitActionButton = computed(() => {
        const { onSubmitAction } = this.viewModel();
        return onSubmitAction;
    });
    canSubmit = signal(false);
    actions = computed(() => {
        const { actions } = this.viewModel();
        const formActions = actions ?? [];

        return [...formActions].filter((x) => x);
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

    onValueChange(e: any) {
        const vm = this.value();
        runInInjectionContext(this.injector, async () => {
            await vm["onValueChange"]?.(e);
        });
    }

    submitted = output<{ submitResult?: any; error?: any }>();
    submitting = signal(false);
    async onSubmit() {
        const vm = this.value();
        runInInjectionContext(this.injector, async () => {
            try {
                this.submitting.set(true);
                const submitResult = (await vm["onSubmit"]?.()) ?? this.value();
                this.submitted.emit({ submitResult });
            } catch (error) {
                this.submitted.emit({ error });
            } finally {
                this.submitting.set(false);
            }
        });
    }

    async onAction(e: ActionEvent): Promise<void> {
        const vm = this.value();
        let { handlerName } = e.action as any;
        if (!handlerName && e.action.type === "submit") handlerName = "onSubmit";
        if (!vm[handlerName]) throw new Error(`Handler ${handlerName} not found in ViewModel`);

        // if (handlerName === "onSubmit") return this.dynamicFormEl().ngForm().ngSubmit.emit();
        return runInInjectionContext(this.injector, async () => {
            await vm[handlerName]();
        });
    }
}
