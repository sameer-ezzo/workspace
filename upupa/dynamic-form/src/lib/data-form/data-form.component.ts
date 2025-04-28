import { Component, inject, signal, computed, input, Injector, runInInjectionContext, model, viewChild, SimpleChanges, output, InjectionToken } from "@angular/core";

import { MatBtnComponent } from "@upupa/mat-btn";
import { CommonModule } from "@angular/common";
import { _defaultControl, ActionEvent, deepAssign, waitForOutput } from "@upupa/common";
import { Class } from "@noah-ark/common";
import { FormControl, NG_VALUE_ACCESSOR, NgControl, ReactiveFormsModule } from "@angular/forms";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { FormViewModelMirror, reflectFormViewModelType } from "../decorators/form-input.decorator";
import { DynamicFormComponent, DynamicFormInitializedEvent, FORM_GRAPH } from "../dynamic-form.component";

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
    imports: [CommonModule, MatBtnComponent, DynamicFormComponent, ReactiveFormsModule, MatProgressSpinnerModule],
    templateUrl: "./data-form.component.html",
    styleUrls: ["./data-form.component.scss"],
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

    _ngControl = inject(NgControl, { optional: true });
    _control = this._ngControl?.control as FormControl;
    _defaultControl = _defaultControl(this);
    control = input<FormControl, FormControl>(this._control ?? this._defaultControl, {
        transform: (v) => {
            return v ?? this._control ?? this._defaultControl;
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

            if (type && !(v instanceof type)) {
                const instance = runInInjectionContext(this._injector(), () => new type());
                deepAssign(instance, v);
                this.value.set(instance);
            }
        }
    }

    onInitialized(e: DynamicFormInitializedEvent) {
        const vm = this.value() as any;
        if (!(vm && "onInit" in vm && typeof vm["onInit"] === "function")) return;
        runInInjectionContext(this._injector(), async () => {
            await vm["onInit"](e);
        });
    }
    onValueChange(e: any) {
        const vm = this.value();
        runInInjectionContext(this._injector(), async () => {
            await vm["onValueChange"]?.(e);
            this.control().patchValue(vm, { emitModelToViewChange:true });
        });
    }

    no = 0;

    submitted = output<{ submitResult?: T; error?: any }>();
    submit_success = output<T>();
    submit_error = output<any>();

    submitting = signal(false);
    async onSubmit(event: { result?: any; error?: any }) {
        // IMPORTANT! Skip for event.error == FORM_IS_PRISTINE since user can submit form with default values (no interaction needed)
        if (event?.error && event.error !== "FORM_IS_PRISTINE") {
            const result = { error: event.error, no: this.no };
            this.no++;
            this.submitted.emit(result);
            this.submit_error.emit(event.error);
            return result;
        }
        const vm = this.value();
        this.submitting.set(true);
        const result = await runInInjectionContext(this._injector(), async () => {
            try {
                const result = (await vm["onSubmit"]?.()) ?? this.value();
                return { submitResult: result };
            } catch (error) {
                return { error };
            }
        });

        this.submitting.set(false);
        this.submitted.emit(result);
        if (result.submitResult) this.submit_success.emit(result.submitResult);
        else this.submit_error.emit(result.error);
        return result;
    }

    async submit(): Promise<{ submitResult?: T; error?: any }> {
        const task = waitForOutput(this as DataFormComponent, "submitted"); // subscribe to output first because returning is faster than emitting
        this.dynamicFormEl().submit();
        return await task;
    }

    async onAction(e: ActionEvent) {
        const vm = this.value();
        const { handlerName } = e.descriptor as any;

        if (e.descriptor.type == "submit" || handlerName === "onSubmit") return this.submit();
        if (!vm[handlerName]) throw new Error(`Handler ${handlerName} not found in ViewModel`);

        return runInInjectionContext(this._injector(), async () => {
            await vm[handlerName]();
        });
    }
}
