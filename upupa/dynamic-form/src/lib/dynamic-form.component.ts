import {
    Component,
    SimpleChanges,
    forwardRef,
    ElementRef,
    OnDestroy,
    OnChanges,
    ViewEncapsulation,
    HostListener,
    inject,
    ChangeDetectionStrategy,
    input,
    output,
    viewChild,
    Injector,
    model,
    Pipe,
    effect,
    InjectionToken,
    signal,
    SimpleChange,
} from "@angular/core";
import {
    NG_VALUE_ACCESSOR,
    ControlValueAccessor,
    AbstractControl,
    UntypedFormBuilder,
    ValueChangeEvent,
    FormGroup,
    FormGroupDirective,
    NgControl,
    AbstractControlDirective,
    ControlContainer,
    FormControl,
    StatusChangeEvent,
    FormResetEvent,
    FormSubmittedEvent,
    PristineChangeEvent,
    TouchedChangeEvent,
} from "@angular/forms";
import { FormScheme } from "./types";
import { Condition } from "@noah-ark/expression-engine";
import { Subscription } from "rxjs";
import { EventBus } from "@upupa/common";
import { ChangeFormSchemeHandler, ChangeInputsHandler, ChangeStateHandler, ChangeValueHandler, InputVisibilityHandler } from "./events/handlers";
import { JsonPointer, Patch } from "@noah-ark/json-patch";
import { DynamicFormModuleOptions } from "./dynamic-form.options";
import { DYNAMIC_FORM_OPTIONS } from "./di.token";
import { DynamicFormBuilder } from "./dynamic-form-renderer";
import { DynamicFormService } from "./dynamic-form.service";
import { ConditionalLogicService } from "./conditional-logic.service";
import { KeyValuePipe } from "@angular/common";
import { FieldRef } from "./field-ref";

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

export function fieldRef(path: string): FieldRef {
    return inject(FORM_GRAPH, { optional: true })?.get(path);
}
@Component({
    // eslint-disable-next-line @angular-eslint/component-selector
    selector: "dynamic-form",
    templateUrl: "./dynamic-form.component.html",
    styleUrls: ["./dynamic-form.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
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
    standalone: false
})
export class DynamicFormComponent<T = any> implements ControlValueAccessor, OnDestroy, OnChanges {
    private readonly conditionalService = inject(ConditionalLogicService);
    private readonly options: DynamicFormModuleOptions = inject(DYNAMIC_FORM_OPTIONS);
    public readonly bus = inject(EventBus);
    private readonly _patches: Map<`group:${string}` | `/${string}`, unknown> = new Map();
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
    _defaultControl = new FormControl({});
    control = input<FormControl, FormControl>(this._control ?? this._defaultControl, {
        transform: (v) => {
            return v ?? this._control ?? this._defaultControl ?? new FormControl({});
        },
    });

    readonly formRef = viewChild<FormGroupDirective>("ngFormRef");
    value = model(undefined);

    fieldValueChange = output<ExtendedValueChangeEvent<T>>();

    submit = output<DynamicFormComponent>();
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
    _builder = new DynamicFormBuilder(inject(Injector), this.formService);

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
            }
            else if (e instanceof PristineChangeEvent) {
                this.control().markAsPristine();
            } else if (e instanceof TouchedChangeEvent) {
                this.control().markAsTouched();
            }
            // else if (e instanceof StatusChangeEvent) {
            //     if (e.status === "VALID") this.control().setErrors(null);
            //     else if (e.status === "INVALID") this.control().setErrors(this.form.errors);
            //     else if (e.status === "PENDING") this.control().setErrors({ pending: true });

            //     if (this.form.enabled) this.control().enable();
            //     else this.control().disable();
            // } else if (e instanceof FormResetEvent) {
            //     this.control().reset();
            //     this._patches.clear();
            //     // update internal value
            // }
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
            // emit initial value change event
            this.fieldValueChange.emit(
                new ExtendedValueChangeEvent(this.value(), this.graph, this.graph.get("/"), undefined, { "/": new SimpleChange(undefined, this.value(), true) }),
            );

            //handlers
            this.subs?.forEach((s) => s.unsubscribe());
            this.subs = [InputVisibilityHandler(this), ChangeFormSchemeHandler(this), ChangeInputsHandler(this), ChangeValueHandler(this), ChangeStateHandler(this)];
        }
        if (changes["value"]) {
            this._patches.clear();
            this.form.patchValue(this.value());
            this.propagateChange();
        }

        if (changes["conditions"]?.firstChange === true) {
            const { currentValue, previousValue } = changes["conditions"];
            if (previousValue?.length) previousValue.forEach((c) => this.conditionalService.removeCondition(c));
            if (currentValue?.length) currentValue.forEach((c) => this.subs.push(this.conditionalService.addCondition(c)));
        }
    }

    injector = inject(Injector);

    ngSubmit() {
        this.formRef().ngSubmit.emit();
    }
    onSubmit(e: Event) {
        e?.stopPropagation();
        e?.preventDefault();
        if (this.form.invalid) {
            this.scrollToError();
        } else this.submit.emit(this);
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
        const c = Array.from(this.graph).find(([c, f]) => f.control.invalid && f.hidden() !== true);
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

@Pipe({
    name: "orderedKeyValue",
    pure: true,
    standalone: false
})
export class OrderedKeyValuePipe extends KeyValuePipe {
    override transform(value: any, ...args: any[]): any {
        return Object.keys(value).map((key) => ({ key, value: value[key] }));
    }
}
