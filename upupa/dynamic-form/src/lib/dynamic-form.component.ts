import {
    Component,
    SimpleChanges,
    forwardRef,
    ElementRef,
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
    computed,
} from "@angular/core";
import {
    NG_VALUE_ACCESSOR,
    ControlValueAccessor,
    AbstractControl,
    ValueChangeEvent,
    FormGroup,
    FormGroupDirective,
    NgControl,
    FormsModule,
    ReactiveFormsModule,
    FormResetEvent,
    FormArray,
} from "@angular/forms";
import { Condition } from "@noah-ark/expression-engine";
import { _defaultControl, _defaultForm, EventBus } from "@upupa/common";
import { JsonPointer, Patch } from "@noah-ark/json-patch";
import { DynamicFormBuilder } from "./dynamic-form-renderer";
import { DynamicFormService } from "./dynamic-form.service";
import { ConditionalLogicService } from "./conditional-logic.service";
import { CommonModule, KeyValuePipe } from "@angular/common";
import { FieldRef } from "./field-ref";
import { ScrollingModule } from "@angular/cdk/scrolling";
import { MatExpansionModule, MatExpansionPanel } from "@angular/material/expansion";
import { DynamicFormFieldComponent } from "./dynamic-form-field.component";
import { FormScheme } from "./types";

import { LoadDirective } from "./load.directive";
import { ParagraphComponent } from "@upupa/dynamic-form-material-theme";
import { MatIconModule } from "@angular/material/icon";
import { deepAssign } from "@noah-ark/common";

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

export const FORM_GROUP = new InjectionToken<FormGroup>("FormControls");
export class ExtendedValueChangeEvent<T = any> {
    get path() {
        return this.source?.path ?? "/";
    }
    constructor(
        public readonly event: ValueChangeEvent<T>,
        public readonly value: T,
        public readonly form: FormGroup,
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
        public readonly form: FormGroup,
        public readonly source?: FieldRef,
    ) {}
}
export function fieldRef<TCom = any>(path: string): FieldRef<TCom> {
    const form = inject<FormGroup>(FORM_GROUP, { host: true }); // make sure to only load graph of the current form (not a parent provided one)
    if (path.startsWith("group:")) {
        const group = form[path];
        return group as FieldRef<TCom>;
    }
    const segments = path.split("/").filter((s) => s.length > 0);
    let current = form as unknown as FormGroup & { fieldRef: FieldRef<TCom> };
    for (const segment of segments) {
        current = current.get(segment) as unknown as FormGroup & { fieldRef: FieldRef<TCom> };
        if (!current) return undefined;
    }
    return current["fieldRef"] as FieldRef<TCom>;
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
            provide: FORM_GROUP,
            useFactory: (df: DynamicFormComponent) => df.form(),
            deps: [DynamicFormComponent],
        },
    ],
    imports: [
        OrderedKeyValuePipe,
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        ScrollingModule,
        DynamicFormFieldComponent,
        ParagraphComponent,
        MatExpansionModule,
        LoadDirective,
        MatIconModule,
    ],
})
export class DynamicFormComponent<T = any> implements ControlValueAccessor, OnChanges {
    readonly conditionalService = inject(ConditionalLogicService);
    readonly injector = inject(Injector);
    readonly bus = inject(EventBus);
    readonly _patches: Map<`group:${string}` | `/${string}`, unknown> = new Map();
    fields = input.required<FormScheme>();

    conditions = input<Condition[]>([]);
    name = input<string>(Date.now().toString());
    disabled = input(false);
    readonly = input(false);
    class = input("");
    theme = input<string>("material");
    enableLogs = input(true);

    _ngControl = inject(NgControl, { optional: true }); // this won't cause circular dependency issue when component is dynamically created
    _control = this._ngControl?.control as FormGroup; // this won't cause circular dependency issue when component is dynamically created
    _defaultControl = _defaultForm(this);
    control = input<FormGroup, FormGroup>(this._control ?? this._defaultControl, {
        transform: (v) => {
            return v ?? this._control ?? this._defaultControl;
        },
    });
    form = computed(() => this.control());
    patchPath = input<string>("/");

    // _syncControl(c: FormControl) {
    //     c.events.subscribe((e) => {
    //         if (e instanceof ValueChangeEvent) {
    //             this.form().patchValue(e.value, { emitEvent: false });
    //         } else if (e instanceof PristineChangeEvent) {
    //             this.form().markAsPristine({ emitEvent: false });
    //         } else if (e instanceof TouchedChangeEvent) {
    //             this.form().markAsTouched({ emitEvent: false });
    //         } else if (e instanceof StatusChangeEvent) {
    //             // When we have a nested form c.enabled will cause loop
    //             // if (c.enabled) this.form().enable({ emitEvent: false });
    //             // else this.form().disable({ emitEvent: false });

    //             if (e.status === "VALID") this.form().setErrors(null, { emitEvent: false });
    //             else if (e.status === "INVALID") this.form().setErrors(c.errors, { emitEvent: false });
    //             else if (e.status === "PENDING") this.form().setErrors({ pending: true }, { emitEvent: false });
    //         } else if (e instanceof FormResetEvent) {
    //             this.form().reset({ emitEvent: false });
    //             this._patches.clear();
    //         }
    //     });

    //     return c;
    // }

    value = model(undefined);

    fieldValueChange = output<ExtendedValueChangeEvent<T>>();
    initialized = output<DynamicFormInitializedEvent<T>>();
    submitted = output<{ event: SubmitEvent; form: FormGroup; result?: T; error?: any; control?: AbstractControl<any, any> }>();
    preventDirtyUnload = input(false);

    get patches(): Patch[] {
        return Array.from(this._patches.entries()).map(([path, value]) => ({ path, op: "replace", value }));
    }

    get dirty() {
        return this.form()?.dirty;
    }
    set dirty(v: boolean) {
        if (v) this.form().markAsDirty();
        else this.form().markAsPristine();
    }
    get pristine() {
        return this.form()?.pristine;
    }
    set pristine(v: boolean) {
        this.dirty = !v;
    }
    get touched() {
        return this.form()?.touched;
    }
    set touched(v: boolean) {
        if (v) this.form().markAsTouched();
        else this.form().markAsUntouched();
    }
    get untouched() {
        return this.form()?.untouched;
    }
    set untouched(v: boolean) {
        this.touched = !v;
    }

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
        if (v === this.value()) return;
        this.value.set(v);
        if (this._ngControl) {
            // only notify changes if control was provided externally
            this.markAsTouched();
            this.propagateChange();
        } else {
            const control = this.form();
            if (control?.value !== v) {
                // we are not using setValue because it is strict when passing object values (all fields must be present)
                control.patchValue(v, { emitEvent: false });
            }
        }
    }

    get invalid() {
        return this.form()?.invalid;
    }
    get valid() {
        return this.form()?.valid;
    }

    formService = inject(DynamicFormService);
    _builder = new DynamicFormBuilder(this.injector, this.formService);

    _observedControl: FormGroup;
    _subscribeToFormEvents() {
        if (this._observedControl === this.control()) return; // already subscribed
        this._observedControl = this.form();
        this.form().events.subscribe((e) => {
            if (e instanceof ValueChangeEvent) {
                const value = this.value() ?? {};

                let source = e.source;

                let sourceField: FieldRef = source?.["fieldRef"] as FieldRef;
                let parentForm: FormGroup | FormArray = sourceField?.form;
                let path = sourceField?.path ?? "/";
                let prevValue = undefined;
                let changeValue = undefined;
                if (source === this.form()) {
                    prevValue = value;
                    changeValue = this.form().value;
                    deepAssign(value, changeValue);
                } else {
                    while (parentForm && parentForm !== this.form()) {
                        source = parentForm;
                        sourceField = source?.["fieldRef"] as FieldRef;
                        path = (sourceField?.path ?? "") + path;
                        parentForm = sourceField?.form;
                    }

                    prevValue = JsonPointer.get(value, path, "/");
                    changeValue = JsonPointer.get(this.form().value, path, "/");
                    JsonPointer.set(value, path, changeValue);
                }

                // if (prevValue === changeValue) return;
                this.handleUserInput(value);

                const patch = { [path]: changeValue } as Record<`/${string}`, unknown>;
                const changes = { [path]: new SimpleChange(prevValue, changeValue, !this._patches.has(path as `/${string}`)) } as SimpleChanges;
                this._patches.set(path as `/${string}`, changeValue);

                const ee = new ExtendedValueChangeEvent(e, value, this.form(), sourceField, patch, changes);

                if (this.enableLogs()) console.log(`${this.name()}:${path} valueChanges`, ee);
                this.fieldValueChange.emit(ee);
            } else if (e instanceof FormResetEvent) {
                this._patches.clear();
            }
        });
    }

    ngOnInit() {
        this._subscribeToFormEvents();
    }

    async ngOnChanges(changes: SimpleChanges): Promise<void> {
        if (changes["name"] && !changes["name"].firstChange) {
            throw `Name cannot be changed after initialized ${this.name()}`;
        }

        if (changes["control"]) {
            this._subscribeToFormEvents();
            this._buildForm();
        } else if (changes["fields"]) {
            this._buildForm();
        }
        if (changes["value"]) {
            this._patches.clear();
            this.form().patchValue(this.value(), { emitEvent: false });
            this.propagateChange();
        }
    }
    private _buildForm() {
        const scheme = this.fields();
        console.info(`${this.name()}:Building Form`, scheme);
        if (typeof scheme !== "object" || Array.isArray(scheme)) throw new Error("fields must be passed as dictionary format");

        this._patches.clear();
        this._builder.build(this.form(), scheme, this.value(), "/");
        this.initialized.emit(new DynamicFormInitializedEvent(this.value(), this.form()));
    }

    // formRef = viewChild<ElementRef<HTMLFormElement>>("formRef");
    formRef = viewChild<FormGroupDirective>("formRef");

    submit() {
        // this.formRef().nativeElement.submit();
        this.formRef().ngSubmit.emit();
    }
    onSubmit(event: SubmitEvent) {
        event?.stopPropagation();
        event?.preventDefault();
        if (this.form().invalid) {
            //expand all groups
            const groups = Object.entries(this.form().controls).filter(([k, c]) => k.startsWith("group:"));
            for (const [group, control] of groups) {
                const g = control["fieldRef"];
                if (g.field?.["template"] == "expansion-panel") {
                    const panel = g.attachedComponentRef().instance as MatExpansionPanel;
                    panel.open();
                }
            }
            const erroredControl = this.scrollToError();
            this.submitted.emit({ event, form: this.form(), error: "FORM_IS_INVALID", control: erroredControl });
        } else if (this.form().pristine) {
            this.submitted.emit({ event, form: this.form(), result: this.value(), error: "FORM_IS_PRISTINE" });
        } else this.submitted.emit({ event, form: this.form(), result: this.value() });
    }

    _onChange: (value: T) => void;
    _onTouched: () => void;

    writeValue(val: T): void {
        if (val === this.value()) return;
        if (this.enableLogs()) console.log(`%c dynamic writing! (name:${this.name()})`, "background: #0065ff; color: #fff", val);
        this.value.set(deepAssign(this.value(), val));
        this.form().patchValue(this.value(), { emitEvent: false, onlySelf: true });
    }

    registerOnChange(fn: (model: any) => void): void {
        this._onChange = fn;
    }
    registerOnTouched(fn: () => void): void {
        this._onTouched = fn;
    }
    setDisabledState?(isDisabled: boolean): void {
        if (isDisabled) this.form()?.disable();
        else this.form()?.enable();
    }

    _fieldsChanged() {
        if (this.enableLogs()) console.log(`%c scheme changed! (name:${this.name()})`, "background: #ff6b00; color: #fff", this.fields());
        // this.form()Renderer.fields = Object.values(this.fields());
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
    scrollToError(): undefined | AbstractControl<any, any> {
        const control = Object.values(this.form().controls).find((c) => c.invalid);
        if (!control) return undefined;
        control.markAsTouched();
        const el = this.host.nativeElement.querySelector(`form [name=${control["fieldRef"].name}]`) as HTMLElement;
        if (!el) return undefined;
        this.scrollToElement(el);
        return control;
    }

    /// @deprecated use patches instead
    getDirtyPatches(): Patch[] {
        return this.patches;
    }

    @HostListener("window:beforeunload", ["$event"])
    beforeunloadHandler(event) {
        if (this.preventDirtyUnload() === true && this.dirty && this.touched) {
            event.preventDefault();
            event.returnValue = true;
        }
    }

    isFormGroup(control: AbstractControl): control is FormGroup {
        return control instanceof FormGroup;
    }
}
