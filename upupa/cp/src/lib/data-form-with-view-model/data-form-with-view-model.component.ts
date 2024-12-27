import { Component, inject, signal, computed, input, Injector, runInInjectionContext, model, viewChild, SimpleChanges, output, InjectionToken } from "@angular/core";
import { DynamicFormComponent, DynamicFormModule, FORM_GRAPH, FormViewModelMirror, reflectFormViewModelType } from "@upupa/dynamic-form";
import { MatBtnComponent } from "@upupa/mat-btn";
import { CommonModule } from "@angular/common";
import { ActionEvent, deepAssign } from "@upupa/common";
import { Class } from "@noah-ark/common";
import { FormControl, NG_VALUE_ACCESSOR, NgControl, ReactiveFormsModule } from "@angular/forms";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";

export const FORM_VIEW_MODEL = new InjectionToken<any[]>("FORM_VIEW_MODEL");

export function injectFormViewModel(viewModel: Class) {
    const values = inject(FORM_VIEW_MODEL);
    return values.find((x) => x.__proto__.constructor === viewModel);
}

@Component({
    selector: "data-form",
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
            useFactory: (form: DynamicFormComponent) => form.graph,
            deps: [DynamicFormComponent],
        },
        {
            provide: NG_VALUE_ACCESSOR,
            useFactory: (self: DataFormWithViewModelComponent) => self.dynamicFormEl(),
            deps: [DataFormWithViewModelComponent],
            multi: true,
        },
        {
            provide: FORM_VIEW_MODEL,
            useFactory: (self: DataFormWithViewModelComponent) => self.value(),
            deps: [DataFormWithViewModelComponent],
            multi: true,
        },
    ],
})
export class DataFormWithViewModelComponent<T = any> {
    private readonly injector = inject(Injector);
    dynamicFormEl = viewChild(DynamicFormComponent);

    label = input<string | undefined>();
    name = input<string | undefined>();
    formName = computed(() => this.name() ?? this.viewModel()?.name ?? new Date().getTime().toString());

    _ngControl = inject(NgControl, { optional: true }); // this won't cause circular dependency issue when component is dynamically created
    _control = this._ngControl?.control as FormControl; // this won't cause circular dependency issue when component is dynamically created
    _defaultControl = new FormControl({});
    control = input<FormControl, FormControl>(this._control ?? this._defaultControl, {
        transform: (v) => {
            return v ?? this._control ?? this._defaultControl ?? new FormControl({});
        },
    });
    loading = signal(false);

    viewModel = input.required<FormViewModelMirror, Class | FormViewModelMirror>({
        transform: (v) => {
            if (typeof v === "function") return reflectFormViewModelType(v);
            return v;
        },
    });

    value = model<T>();

    // form actions
    canSubmit = signal(false);
    actions = computed(() => {
        const { actions } = this.viewModel();
        const formActions = actions ?? [];
        return [...formActions].filter((x) => x);
    });

    _injector() {
        return Injector.create({
            providers: [
                {
                    provide: this.viewModel().viewModelType,
                    useValue: this.value(),
                },
            ],
            parent: this.injector,
        });
    }

    // private instance = signal<any>(null);
    ngOnChanges(changes: SimpleChanges) {
        const v = this.value();
        const type = this.viewModel().viewModelType;

        if (!(v instanceof type)) {
            let instance: any;
            runInInjectionContext(this._injector(), () => {
                instance = new type();
            });
            deepAssign(instance, v);
            this.value.set(instance);
            // this.control().setValue(instance, { emitEvent: false });
        }
    }

    onValueChange(e: any) {
        const vm = this.value();
        runInInjectionContext(this._injector(), async () => {
            await vm["onValueChange"]?.(e);
            this.control().patchValue(vm, { emitEvent: false });
        });
    }

    submitted = output<{ submitResult?: T; error?: any }>();
    submitting = signal(false);
    async onSubmit() {
        const vm = this.value();
        this.submitting.set(true);

        let submitResult: T | undefined;
        let error = undefined;

        await runInInjectionContext(this._injector(), async () => {
            try {
                submitResult = (await vm["onSubmit"]?.()) ?? this.value();
                this.submitted.emit({ submitResult });
            } catch (err) {
                error = err;
                this.submitted.emit({ error: err });
            } finally {
                this.submitting.set(false);
            }
        });

        return { error, submitResult };
    }

    submit() {
        return this.dynamicFormEl().submit();
    }

    async onAction(e: ActionEvent): Promise<void> {
        const vm = this.value();
        const { handlerName } = e.action as any;

        if (e.action.type == "submit" || handlerName === "onSubmit") return this.submit();
        if (!vm[handlerName]) throw new Error(`Handler ${handlerName} not found in ViewModel`);

        return runInInjectionContext(this._injector(), async () => {
            await vm[handlerName]();
        });
    }
}
