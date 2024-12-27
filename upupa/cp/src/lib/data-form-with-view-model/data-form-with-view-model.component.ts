import { Component, inject, signal, computed, input, Injector, runInInjectionContext, model, viewChild, SimpleChanges, output, InjectionToken } from "@angular/core";
import { DynamicFormComponent, DynamicFormModule, FORM_GRAPH, FormViewModelMirror, reflectFormViewModelType } from "@upupa/dynamic-form";
import { MatBtnComponent } from "@upupa/mat-btn";
import { CommonModule } from "@angular/common";
import { ActionEvent, deepAssign } from "@upupa/common";
import { Class } from "@noah-ark/common";
import { FormControl, NG_VALUE_ACCESSOR, NgControl, ReactiveFormsModule } from "@angular/forms";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";

export const FORM_VIEW_MODEL = new InjectionToken<any>("FORM_VIEW_MODEL");

export function injectFormViewModels(): any[] {
    const fromSelf = inject(FORM_VIEW_MODEL, { optional: true, self: true });
    const fromParent = inject(FORM_VIEW_MODEL, { optional: true, skipSelf: true });
    return [fromSelf, fromParent].filter((x) => x);
}
export function injectFormViewModel(viewModel: Class | FormViewModelMirror) {
    const _class = "viewModelType" in viewModel ? viewModel.viewModelType : viewModel;
    const models = injectFormViewModels();
    return models.find((x) => x.__proto__.constructor === _class);
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
            useFactory: (self: DataFormComponent) => self.dynamicFormEl(),
            deps: [DataFormComponent],
        },
        {
            provide: FORM_GRAPH,
            useFactory: (form: DynamicFormComponent) => form.graph,
            deps: [DynamicFormComponent],
        },
        {
            provide: NG_VALUE_ACCESSOR,
            useFactory: (self: DataFormComponent) => self.dynamicFormEl(),
            deps: [DataFormComponent],
            multi: true,
        },
        {
            provide: FORM_VIEW_MODEL,
            useFactory: (self: DataFormComponent) => self.value(),
            deps: [DataFormComponent],
        },
    ],
})
export class DataFormComponent<T = any> {
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
        return this.injector;
    }

    // private instance = signal<any>(null);
    ngOnChanges(changes: SimpleChanges) {
        if (changes["viewModel"] || changes["value"]) {
            const v = this.value();
            const type = this.viewModel().viewModelType;

            if (!(v instanceof type)) {
                const instance = runInInjectionContext(this._injector(), () => new type());
                deepAssign(instance, v);
                this.value.set(instance);
            }
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
    onSubmit(): Promise<{ submitResult?: any; error?: any }> {
        const vm = this.value();
        this.submitting.set(true);

        let submitResult: T | undefined;
        let error = undefined;

        return runInInjectionContext(this._injector(), async () => {
            try {
                submitResult = (await vm["onSubmit"]?.()) ?? this.value();
                this.submitted.emit({ submitResult });
                return { submitResult };
            } catch (error) {
                this.submitted.emit({ error });
                return { error };
            } finally {
                this.submitting.set(false);
            }
        });
    }

    submit() {
        return this.dynamicFormEl().submit();
    }

    async onAction(e: ActionEvent): Promise<void> {
        const vm = this.value();
        let { handlerName } = e.action as any;

        if (e.action.type == "submit" || handlerName === "onSubmit") return this.submit();
        if (!vm[handlerName]) throw new Error(`Handler ${handlerName} not found in ViewModel`);

        return runInInjectionContext(this._injector(), async () => {
            await vm[handlerName]();
        });
    }
}
