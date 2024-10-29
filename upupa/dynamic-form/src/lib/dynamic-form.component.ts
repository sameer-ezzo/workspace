import {
    Component,
    SimpleChanges,
    forwardRef,
    ElementRef,
    OnDestroy,
    OnChanges,
    ViewEncapsulation,
    Renderer2,
    HostListener,
    inject,
    ChangeDetectionStrategy,
    input,
    output,
    viewChild,
    model,
    signal,
} from "@angular/core";
import { NG_VALUE_ACCESSOR, ControlValueAccessor, AbstractControl, NgForm, UntypedFormBuilder, NG_VALIDATORS } from "@angular/forms";
import { Field, FormScheme } from "./types";
import { Condition } from "@noah-ark/expression-engine";
import { Subscription } from "rxjs";
import { EventBus } from "@upupa/common";
import { ChangeFormSchemeHandler, ChangeInputsHandler, ChangeStateHandler, ChangeValueHandler, InputVisibilityHandler } from "./events/handlers";
import { JsonPointer, Patch } from "@noah-ark/json-patch";
import { DynamicFormModuleOptions } from "./dynamic-form.options";
import { DYNAMIC_FORM_OPTIONS } from "./di.token";
import { DynFormBuilder } from "./dynamic-form-renderer";
import { DynamicFormService } from "./dynamic-form.service";
import { ConditionalLogicService } from "./conditional-logic.service";
import { DialogService } from "@upupa/dialog";

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
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => DynamicFormComponent),
            multi: true,
        },
        {
            provide: DynFormBuilder,
            useFactory: (fb: UntypedFormBuilder, formService: DynamicFormService, bus: EventBus) => new DynFormBuilder(fb, formService, bus),
            deps: [UntypedFormBuilder, DynamicFormService, EventBus],
        },
    ],
    host: {
        "[class]": "class()",
        "[attr.name]": "name()",
    },
})
export class DynamicFormComponent<T = any> implements ControlValueAccessor, OnDestroy, OnChanges {
    // protected readonly formService = inject(DynamicFormService);
    private readonly builder = inject(DynFormBuilder);

    public readonly el = inject(ElementRef);
    public readonly renderer = inject(Renderer2);
    public readonly conditionalService = inject(ConditionalLogicService);
    public readonly bus = inject(EventBus);
    public readonly dialog = inject(DialogService);
    public readonly options: DynamicFormModuleOptions = inject(DYNAMIC_FORM_OPTIONS);

    // eslint-disable-next-line @angular-eslint/no-output-native
    submit = output<DynamicFormComponent>();

    conditions = input<Condition[]>([]);
    name = input<string>(`dynForm_${Date.now()}`, { alias: "formName" });

    disabled = input(false);
    readonly = input(false);

    ngFormEl = viewChild.required<NgForm>("dynForm");
    // control = input<AbstractControl>(null);

    theme = input<string>("material");

    value = model<T>();
    class = input("");

    preventDirtyUnload = input(false);

    fields = input.required<FormScheme>();

    _onChange: (value: T) => void;
    _onTouched: () => void;
    get dirty() {
        return this.ngFormEl()?.dirty;
    }
    set dirty(v: boolean) {
        if (v) this.ngFormEl().control.markAsDirty();
        else this.ngFormEl().control.markAsPristine();
    }
    get pristine() {
        return this.ngFormEl()?.pristine;
    }
    set pristine(v: boolean) {
        this.dirty = !v;
    }
    get touched() {
        return this.ngFormEl()?.touched;
    }
    set touched(v: boolean) {
        if (v) this.ngFormEl().control.markAsTouched();
        else this.ngFormEl().control.markAsUntouched();
    }
    get untouched() {
        return this.ngFormEl()?.untouched;
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

    get invalid() {
        return this.ngFormEl()?.invalid;
    }
    get valid() {
        return this.ngFormEl()?.valid;
    }

    _keys(x) {
        return Object.keys(x);
    }
    _values(x: FormScheme): Field[] {
        return Object.values(x);
    }

    getFieldIfo(f: Field) {
        return this.builder.getBuilderField(f);
    }

    get controls() {
        return new Map(Array.from(this.builder.controls).map((c) => [c[0], c[1].control]));
    }

    formScheme = signal<FormScheme>(null);
    formGroupValueChange: Subscription;

    async ngOnChanges(changes: SimpleChanges): Promise<void> {
        if (changes["name"] && !changes["name"].firstChange) {
            throw `Name cannot be changed after initialized ${this.name()}`;
        }

        if (changes["fields"]) {
            this.formGroupValueChange?.unsubscribe();

            const scheme = this.fields();
            if (typeof scheme !== "object" || Array.isArray(scheme)) throw new Error("fields must be passed as dictionary format");
            this.builder?.destroy();
            this.formScheme.set(this.builder.build(this.fields(), this.theme(), this.value()));

            this.formGroupValueChange = this.builder.form.valueChanges.subscribe((v) => {
                if (v === this.value()) return;
                this.value.set(v);
                this.builder.form.markAsTouched();
                this._propagateChange();
            });

            //handlers
            this.subs?.forEach((s) => s.unsubscribe());
            this.subs = [InputVisibilityHandler(this), ChangeFormSchemeHandler(this), ChangeInputsHandler(this), ChangeValueHandler(this), ChangeStateHandler(this)];
        }

        if (changes["value"] && !changes["fields"]) {
            const { currentValue, previousValue } = changes["value"];
            if (currentValue !== previousValue) this.builder.form.patchValue(currentValue, { emitEvent: false });
        }
        if (changes["conditions"]?.firstChange === true) {
            const { currentValue, previousValue } = changes["conditions"];
            if (previousValue?.length) previousValue.forEach((c) => this.conditionalService.removeCondition(c));
            if (currentValue?.length) currentValue.forEach((c) => this.subs.push(this.conditionalService.addCondition(c)));
        }
    }

    onSubmit(e: Event) {
        e.stopPropagation();
        e.preventDefault();
        if (this.ngFormEl().invalid) {
            this.scrollToError();
        } else this.submit.emit(this);
    }

    writeValue(val: T): void {
        if (this.options.enableLogs === true) console.log(`%c dynamic writing! (name:${this.name()})`, "background: #0065ff; color: #fff", val);
        this.value.set(val);
        this.builder.form?.patchValue(val);
    }

    _propagateChange() {
        if (this._onChange) this._onChange(this.value());
    }

    registerOnChange(fn: (model: any) => void): void {
        this._onChange = fn;
    }
    registerOnTouched(fn: () => void): void {
        this._onTouched = fn;
    }
    setDisabledState?(isDisabled: boolean): void {
        if (isDisabled) this.builder.form?.disable();
        else this.builder.form?.enable();
    }

    _fieldsChanged() {
        if (this.options.enableLogs === true) console.log(`%c scheme changed! (name:${this.name()})`, "background: #ff6b00; color: #fff", this.fields());
        // this.formRenderer.fields = Object.values(this.fields());
        // this.writeValue(this.value());
        this._propagateChange();
    }

    scrollToElement(element: HTMLElement, focus = true) {
        if (!element) return;
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        if (focus)
            setTimeout(() => {
                element.focus();
            }, 400); //wait scroll animation
    }
    scrollToError() {
        const c = Array.from(this.controls).filter((c) => c[1].invalid && c[0].ui?.hidden !== true)?.[0];
        if (!c) return;
        c[1].markAsTouched();
        const el = document.getElementById(c[0].name) ?? <HTMLElement>document.querySelector("form :not(fieldset).ng-touched.ng-invalid");
        if (el) this.scrollToElement(el);
    }

    getDirtyPatches(): Patch[] {
        return Array.from(this.controls)
            .filter((e) => (e[1] as AbstractControl).dirty)
            .map((e) => {
                const path = (e[0] as Field)?.path;
                return {
                    path,
                    op: "replace",
                    value: JsonPointer.get(this.value, path),
                } as Patch;
            });
    }
    getDirtyValue(): Record<string, any> {
        const dirty = {};
        const dirtyControls = Array.from(this.controls).filter((e) => (e[1] as AbstractControl).dirty);
        if (dirtyControls.length === 0) return null;

        dirtyControls.map((e) => (e[0] as Field)?.path).forEach((p) => JsonPointer.set(dirty, p, JsonPointer.get(this.value, p)));
        return dirty;
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
        this.builder.destroy();
    }
}
