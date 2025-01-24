import {
    Component,
    SimpleChanges,
    forwardRef,
    ElementRef,
    OnDestroy,
    OnChanges,
    HostListener,
    inject,
    ChangeDetectionStrategy,
    input,
    output,
    viewChild,
    Injector,
    model,
    Pipe,
    InjectionToken,
    SimpleChange,
} from "@angular/core";
import {
    NG_VALUE_ACCESSOR,
    ControlValueAccessor,
    AbstractControl,
    ValueChangeEvent,
    FormGroup,
    FormGroupDirective,
    NgControl,
    FormControl,
    PristineChangeEvent,
    TouchedChangeEvent,
    FormsModule,
    ReactiveFormsModule,
    StatusChangeEvent,
    FormResetEvent,
} from "@angular/forms";
import { Condition } from "@noah-ark/expression-engine";
import { Subscription } from "rxjs";
import { _defaultControl, EventBus, UtilsModule } from "@upupa/common";
import { ChangeFormSchemeHandler, ChangeInputsHandler, ChangeStateHandler, ChangeValueHandler, InputVisibilityHandler } from "./events/handlers";
import { JsonPointer, Patch } from "@noah-ark/json-patch";
import { DynamicFormModuleOptions } from "./dynamic-form.options";
import { DYNAMIC_FORM_OPTIONS } from "./di.token";
import { DynamicFormBuilder } from "./dynamic-form-renderer";
import { DynamicFormService } from "./dynamic-form.service";
import { ConditionalLogicService } from "./conditional-logic.service";
import { CommonModule, KeyValuePipe } from "@angular/common";
import { FieldRef } from "./field-ref";
import { ScrollingModule } from "@angular/cdk/scrolling";
import { MatExpansionModule } from "@angular/material/expansion";
import { DynamicFormNativeThemeModule } from "@upupa/dynamic-form-native-theme";
import { DynamicFormFieldComponent } from "./dynamic-form-field.component";
import { FormScheme } from "./types";

@Pipe({
    name: "orderedKeyValue",
    pure: true,
    standalone: true,
})
export class OrderedKeyValuePipe extends KeyValuePipe {
    override transform(value: any, ...args: any[]): any {
        return Object.keys(value).map((key) => ({ key, value: value[key] }));
    }
}

export type FormGraph = Map<string, FieldRef>;
export const FORM_GRAPH = new InjectionToken<FormGraph>("FormControls");
export class ExtendedValueChangeEvent<T = any> {
    get path() {
        return this.source?.path ?? "/";
    }
    constructor(
        public readonly value: T,
        public readonly graph: FormGraph,
        public readonly source?: FieldRef,
        public readonly patch?: Record<`/${string}`, unknown>,
        public readonly changes?: SimpleChanges,
    ) {}
}

export class DynamicFormInitializedEvent<T = any> {
    get path() {
        return this.source?.path ?? "/";
    }
    constructor(
        public readonly value: T,
        public readonly graph: FormGraph,
        public readonly source?: FieldRef,
    ) {}
}
export function fieldRef<TCom = any>(path: string): FieldRef<TCom> {
    const graph = inject<FormGraph>(FORM_GRAPH, { host: true }); // make sure to only load graph of the current form (not a parent provided one)
    const result = graph.get(path);
    if (!result) throw new Error(`Could not inject field ref with path ${path}`);
    return result;
}
@Component({
    selector: "dynamic-form",
    templateUrl: "./dynamic-form.component.html",
    styleUrls: ["./dynamic-form.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    // encapsulation: ViewEncapsulation.None,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => DynamicFormComponent),
            multi: true,
        },
        {
            provide: FORM_GRAPH,
            useFactory: (form: DynamicFormComponent) => form.graph,
            deps: [DynamicFormComponent],
        },
    ],
    host: {
        "[class]": "'dynamic-form ' + class()",
    },
    standalone: true,
    imports: [
        OrderedKeyValuePipe,
        CommonModule,
        UtilsModule,
        FormsModule,
        ReactiveFormsModule,
        ScrollingModule,
        DynamicFormNativeThemeModule,
        DynamicFormFieldComponent,
        MatExpansionModule,
    ],
})
export class DynamicFormComponent<T = any> implements ControlValueAccessor, OnDestroy, OnChanges {
    readonly conditionalService = inject(ConditionalLogicService);
    readonly injector = inject(Injector);
    readonly options: DynamicFormModuleOptions = inject(DYNAMIC_FORM_OPTIONS);
    readonly bus = inject(EventBus);
    readonly _patches: Map<`group:${string}` | `/${string}`, unknown> = new Map();
    fields = input.required<FormScheme>();

    conditions = input<Condition[]>([]);
    name = input<string>(Date.now().toString());
    disabled = input(false);
    readonly = input(false);
    class = input("");
    theme = input<string>("material");

    form = new FormGroup({});
    _ngControl = inject(NgControl, { optional: true }); // this won't cause circular dependency issue when component is dynamically created
    _control = this._ngControl?.control as FormControl; // this won't cause circular dependency issue when component is dynamically created
    _defaultControl = this._syncControl(_defaultControl(this));
    control = input<FormControl, FormControl>(this._control ?? this._defaultControl, {
        transform: (v) => {
            return this._syncControl(v) ?? this._control ?? this._defaultControl;
        },
    });

    _syncControl(c: FormControl) {
        c.events.subscribe((e) => {
            if (e instanceof ValueChangeEvent) {
                this.form.patchValue(e.value, { emitEvent: false });
            } else if (e instanceof PristineChangeEvent) {
                this.form.markAsPristine({ emitEvent: false });
            } else if (e instanceof TouchedChangeEvent) {
                this.form.markAsTouched({ emitEvent: false });
            } else if (e instanceof StatusChangeEvent) {
                if (c.enabled) this.form.enable({ emitEvent: false });
                else this.form.disable({ emitEvent: false });

                if (e.status === "VALID") this.form.setErrors(null, { emitEvent: false });
                else if (e.status === "INVALID") this.form.setErrors(c.errors, { emitEvent: false });
                else if (e.status === "PENDING") this.form.setErrors({ pending: true }, { emitEvent: false });
            } else if (e instanceof FormResetEvent) {
                this.form.reset({ emitEvent: false });
                this._patches.clear();
            }
        });

        return c;
    }

    value = model(undefined);

    fieldValueChange = output<ExtendedValueChangeEvent<T>>();
    initialized = output<DynamicFormInitializedEvent<T>>();
    submitted = output<T>();
    preventDirtyUnload = input(false);

    get patches(): Patch[] {
        return Array.from(this._patches.entries()).map(([path, value]) => ({ path, op: "replace", value }));
    }

    get dirty() {
        return this.form?.dirty;
    }
    set dirty(v: boolean) {
        if (v) this.form.markAsDirty();
        else this.form.markAsPristine();
    }
    get pristine() {
        return this.form?.pristine;
    }
    set pristine(v: boolean) {
        this.dirty = !v;
    }
    get touched() {
        return this.form?.touched;
    }
    set touched(v: boolean) {
        if (v) this.form.markAsTouched();
        else this.form.markAsUntouched();
    }
    get untouched() {
        return this.form?.untouched;
    }
    set untouched(v: boolean) {
        this.touched = !v;
    }

    subs: Subscription[] = [];

    markAsDirty() {
        this.dirty = true;
    }
    markAsPristine() {
        this.pristine = true;
    }
    markAsTouched() {
        this.touched = true;
    }
    markAsUntouched() {
        this.untouched = true;
    }
    propagateChange() {
        this._onChange?.(this.value());
    }

    handleUserInput(v: T) {
        this.value.set(v);
        if (this._ngControl) {
            // only notify changes if control was provided externally
            this.markAsTouched();
            this.propagateChange();
        } else {
            this.control().setValue(v);
        }
    }

    get invalid() {
        return this.form?.invalid;
    }
    get valid() {
        return this.form?.valid;
    }

    graph: FormGraph = new Map();

    formService = inject(DynamicFormService);
    _builder = new DynamicFormBuilder(this.injector, this.formService);

    constructor() {
        this.form.events.subscribe((e) => {
            if (e instanceof ValueChangeEvent) {
                const value = this.value() ?? {};
                const source = e.source as AbstractControl & { fieldRef: FieldRef };
                const path = source.fieldRef?.path ?? "/";
                const changes = { [path]: new SimpleChange(JsonPointer.get(value, path, "/"), source.value, !this._patches.has(path)) };
                JsonPointer.set(value, path, source.value);
                let patch = undefined;
                if (path) {
                    patch = { [path]: source.value };
                    this._patches.set(path, source.value);
                }

                this.handleUserInput(value);

                const ee = new ExtendedValueChangeEvent(value, this.graph, source.fieldRef, patch, changes);
                if (this.options.enableLogs === true) console.log(`${this.name()}:${path} valueChanges`, ee);
                this.fieldValueChange.emit(ee);
            } else if (e instanceof PristineChangeEvent) {
                if (!this.control().pristine) this.control().markAsPristine();
            } else if (e instanceof TouchedChangeEvent) {
                if (!this.control().touched) this.control().markAsTouched();
            } else if (e instanceof StatusChangeEvent) {
                // if (e.status === "VALID") this.control().setErrors(null);
                // else if (e.status === "INVALID") this.control().setErrors(this.form.errors);
                // else if (e.status === "PENDING") this.control().setErrors({ pending: true });

                if (this.form.enabled && this.control().disabled) this.control().enable();
                if (!this.form.enabled && this.control().enabled) this.control().disable();
            } else if (e instanceof FormResetEvent) {
                this.control().reset();
                this._patches.clear();
            }
        });
    }

    async ngOnChanges(changes: SimpleChanges): Promise<void> {
        if (changes["name"] && !changes["name"].firstChange) {
            throw `Name cannot be changed after initialized ${this.name()}`;
        }

        if (changes["fields"]) {
            const scheme = this.fields();
            if (typeof scheme !== "object" || Array.isArray(scheme)) throw new Error("fields must be passed as dictionary format");

            this._patches.clear();
            this.graph = this._builder.build(this.form, scheme, this.value(), "/");
            this.initialized.emit(new DynamicFormInitializedEvent(this.value(), this.graph));

            //handlers
            this.subs?.forEach((s) => s.unsubscribe());
            this.subs = [InputVisibilityHandler(this), ChangeFormSchemeHandler(this), ChangeInputsHandler(this), ChangeValueHandler(this), ChangeStateHandler(this)];
        }
        if (changes["value"]) {
            this._patches.clear();
            this.form.patchValue(this.value(), { emitEvent: false });
            this.propagateChange();
        }

        if (changes["conditions"]?.firstChange === true) {
            const { currentValue, previousValue } = changes["conditions"];
            if (previousValue?.length) previousValue.forEach((c) => this.conditionalService.removeCondition(c));
            if (currentValue?.length) currentValue.forEach((c) => this.subs.push(this.conditionalService.addCondition(c)));
        }
    }

    // formRef = viewChild<ElementRef<HTMLFormElement>>("formRef");
    formRef = viewChild<FormGroupDirective>("formRef");

    submit() {
        // this.formRef().nativeElement.submit();
        this.formRef().ngSubmit.emit();
    }
    onSubmit(e: SubmitEvent) {
        e?.stopPropagation();
        e?.preventDefault();
        if (this.form.invalid) {
            this.scrollToError();
        } else this.submitted.emit(this.value());
    }

    _onChange: (value: T) => void;
    _onTouched: () => void;

    writeValue(val: T): void {
        if (this.options.enableLogs === true) console.log(`%c dynamic writing! (name:${this.name()})`, "background: #0065ff; color: #fff", val);
        this.value.set(val);
        this.form.patchValue(val, { emitEvent: false, onlySelf: true });
    }

    registerOnChange(fn: (model: any) => void): void {
        this._onChange = fn;
    }
    registerOnTouched(fn: () => void): void {
        this._onTouched = fn;
    }
    setDisabledState?(isDisabled: boolean): void {
        if (isDisabled) this.form?.disable();
        else this.form?.enable();
    }

    _fieldsChanged() {
        if (this.options.enableLogs === true) console.log(`%c scheme changed! (name:${this.name()})`, "background: #ff6b00; color: #fff", this.fields());
        // this.formRenderer.fields = Object.values(this.fields());
        // this.writeValue(this.value());
        this.propagateChange();
    }

    scrollToElement(element: HTMLElement, focus = true) {
        if (!element) return;
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        if (focus)
            setTimeout(() => {
                element.focus();
            }, 400); //wait scroll animation
    }
    host = inject<ElementRef<HTMLElement>>(ElementRef);
    scrollToError() {
        const c = Array.from(this.graph).find(([c, f]) => f.control?.invalid && f.hidden() !== true);
        if (!c) return;
        const fieldRef = c[1] as FieldRef;
        const control = fieldRef.control;
        control.markAsTouched();
        const el = this.host.nativeElement.querySelector(`form [name=${fieldRef.name}]`) as HTMLElement;
        if (el) this.scrollToElement(el);
    }

    /// @deprecated use patches instead
    getDirtyPatches(): Patch[] {
        return this.patches;
    }

    @HostListener("window:beforeunload", ["$event"])
    beforeunloadHandler(event) {
        if (this.preventDirtyUnload() === true && this.dirty) {
            event.preventDefault();
            event.returnValue = true;
        }
    }

    ngOnDestroy(): void {
        this.subs.forEach((s) => s.unsubscribe());
    }

    isFormGroup(control: AbstractControl): control is FormGroup {
        return control instanceof FormGroup;
    }
}
