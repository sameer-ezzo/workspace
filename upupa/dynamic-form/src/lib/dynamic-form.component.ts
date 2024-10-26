import {
    Component,
    Input,
    SimpleChanges,
    forwardRef,
    ElementRef,
    OnDestroy,
    OnInit,
    OnChanges,
    ViewEncapsulation,
    Renderer2,
    HostListener,
    inject,
    ChangeDetectorRef,
    ChangeDetectionStrategy,
    input,
    output,
    viewChild,
    effect,
    model,
    computed,
    ComponentRef,
} from "@angular/core";
import { NG_VALUE_ACCESSOR, ControlValueAccessor, AbstractControl, NgForm, UntypedFormBuilder, NG_VALIDATORS, UntypedFormGroup } from "@angular/forms";
import { Field, FieldItem, Fieldset, FormScheme } from "./types";
import { Condition } from "@noah-ark/expression-engine";
import { Subscription } from "rxjs";
import { DynamicComponent, EventBus, PortalComponent } from "@upupa/common";
import { ChangeFormSchemeHandler, ChangeInputsHandler, ChangeStateHandler, ChangeValueHandler, InputVisibilityHandler } from "./events/handlers";
import { JsonPointer, Patch } from "@noah-ark/json-patch";
import { DynamicFormModuleOptions } from "./dynamic-form.options";
import { DYNAMIC_FORM_OPTIONS } from "./di.token";
import { DynamicFormRenderer, schemeToFields } from "./dynamic-form-renderer";
import { DynamicFormService } from "./dynamic-form.service";
import { ConditionalLogicService } from "./conditional-logic.service";
import { DialogService } from "@upupa/dialog";
import { DynamicFormInputsMapService } from "./dynamic-form-inputsMap.service";
import { IFieldInputResolver } from "./ifield-input.resolver";
import { DynamicFormNativeThemeModule } from "@upupa/dynamic-form-native-theme";
import { delay } from "@noah-ark/common";

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
    ],
    host: {
        "[class]": "class()",
        "[attr.name]": "name()",
    },
})
export class DynamicFormComponent<T = any> implements ControlValueAccessor, OnDestroy, OnChanges {
    formRenderer!: DynamicFormRenderer;

    public readonly el = inject(ElementRef);
    public readonly renderer = inject(Renderer2);
    public readonly conditionalService = inject(ConditionalLogicService);
    public readonly fb = inject(UntypedFormBuilder);
    public readonly bus = inject(EventBus);
    public readonly dialog = inject(DialogService);
    protected readonly formService = inject(DynamicFormService);
    public readonly options: DynamicFormModuleOptions = inject(DYNAMIC_FORM_OPTIONS);

    // eslint-disable-next-line @angular-eslint/no-output-native
    submit = output<DynamicFormComponent>();

    class = input("");

    preventDirtyUnload = input(false);

    formGroup = this.fb.group({});
    fields = input.required<FormScheme>();
    vm = computed(() => {
        const scheme = this.fields();
        const { formGroup, fields } = schemeToFields(scheme, this.fb, this.value(), this.formService, this.theme());
        return { fields, formGroup };
    });
    conditions = input<Condition[]>([]);
    name = input<string>(`dynForm_${Date.now()}`, { alias: "formName" });

    disabled = input(false);
    readonly = input(false);

    ngFormEl = viewChild.required<NgForm>("dynForm");
    // control = input<AbstractControl>(null);

    theme = input<string, string>(this.formService.defaultThemeName, {
        transform: (v: string) => v ?? this.formService.defaultThemeName,
    });

    value = model<T>();

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

    get controls() {
        return this.formRenderer.controls;
    }

    init() {
        const theme = this.theme() ?? this.formService.defaultThemeName;
        this.subs?.forEach((s) => s.unsubscribe());
        this.formRenderer?.destroy();
        this.formRenderer = new DynamicFormRenderer(this.formService, theme, this.bus, this.fb, this.dialog, this, this.renderer, this.disabled());
        this.formRenderer.value$.subscribe((v) => {
            if (v === this.value()) return;
            this.value.set(v);
            this._propagateChange();
        });
        //handlers
        this.subs = [InputVisibilityHandler(this), ChangeFormSchemeHandler(this), ChangeInputsHandler(this), ChangeValueHandler(this), ChangeStateHandler(this)];
    }

    constructor() {
        this.init();
    }

    async ngOnChanges(changes: SimpleChanges): Promise<void> {
        if (changes["name"] && !changes["name"].firstChange) {
            throw `Name cannot be changed after initialized ${this.name()}`;
        }

        if (changes["fields"]) {
            const fields = this.fields();
            if (typeof fields !== "object" || Array.isArray(fields)) throw new Error("fields must be passed as dictionary format");

            this._fieldsChanged();
        }

        if (changes["value"]) {
            const { currentValue, previousValue } = changes["value"];

            if (currentValue !== previousValue) this.writeValue(changes["value"].currentValue);
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
        this.formRenderer.writeValue(val);
    }

    coco = model();

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
        if (isDisabled) this.formRenderer.form.disable();
        else this.formRenderer.form.enable();
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
        const c = Array.from(this.formRenderer.controls).filter((c) => c[1].invalid && c[0].ui?.hidden !== true)?.[0];
        if (!c) return;
        c[1].markAsTouched();
        const el = document.getElementById(c[0].name) ?? <HTMLElement>document.querySelector("form :not(fieldset).ng-touched.ng-invalid");
        if (el) this.scrollToElement(el);
    }

    getDirtyPatches(): Patch[] {
        return Array.from(this.formRenderer.controls)
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
        const dirtyControles = Array.from(this.formRenderer.controls).filter((e) => (e[1] as AbstractControl).dirty);
        if (dirtyControles.length === 0) return null;

        dirtyControles.map((e) => (e[0] as Field)?.path).forEach((p) => JsonPointer.set(dirty, p, JsonPointer.get(this.value, p)));
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
        this.formRenderer.destroy();
    }
}

@Component({
    standalone: true,
    selector: "dynamic-form-field",
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => DynamicFormInputWrapper),
            multi: true,
        },
    ],
    imports: [PortalComponent, DynamicFormNativeThemeModule],
    template: `
        @if (field().text) {
            <paragraph [class.hidden]="field().ui?.hidden === true" [text]="field().text" [renderer]="field().ui?.inputs?.['renderer'] || 'markdown'"></paragraph>
        }
        <!-- <ng-container *ngComponentOutlet="template().component; inputs: template().inputs" [formControlName]="field().name" [formGroup]="form()"> </ng-container> -->
        <portal [component]="template().component" [class]="template().class" [inputs]="template().inputs" [outputs]="template().outputs" (attached)="onAttached($event)"> </portal>
    `,

    host: {
        "[id]": "id()",
        "[class]": "classList()",
    },
})
export class DynamicFormInputWrapper {
    field = input.required<Field>();

    form = input.required<UntypedFormGroup>();
    template = input.required<DynamicComponent, DynamicComponent>({
        transform: (v) => {
            let inputs = { ...(v.inputs ?? {}) };
            const inputsMap = this.inputsMapService.inputsMap;
            const inputNames = Object.keys(inputs);

            inputNames.forEach(async (name) => {
                const inputResolver = inputsMap[name] as IFieldInputResolver;
                if (inputResolver) {
                    inputs = await inputResolver.resolve(inputs);
                }
            });

            v.inputs = inputs;
            return v;
        },
    });

    classList = computed(() => {
        const field = this.field();
        const template = this.template();
        return [`${field.name}-input`, "ff-container", template.class, field.ui.class, field.ui?.hidden === true ? "hidden" : ""]
            .filter((c) => c)
            .join("&nbsp;")
            .trim();
    });
    id = computed(() => ((this.field().ui?.id || this.field().name) ?? "") + "-container");

    private readonly inputsMapService = inject(DynamicFormInputsMapService);

    value = model();
    writeValue(obj: any): void {
        this.value.set(obj);
        this.childValueAccessor?.writeValue(obj);
    }

    private _onChange: (value: any) => void;
    registerOnChange(fn: (value: any) => void): void {
        this._onChange = fn;
        this.childValueAccessor?.registerOnChange(fn);
    }
    private _onTouched: () => void;
    registerOnTouched(fn: () => void): void {
        this._onTouched = fn;
        this.childValueAccessor?.registerOnTouched(fn);
    }

    isDisabled = model(false);
    setDisabledState?(isDisabled: boolean): void {
        this.isDisabled.set(isDisabled);
        this.childValueAccessor?.setDisabledState?.(isDisabled);
    }

    childValueAccessor?: ControlValueAccessor;
    onAttached({ componentRef }: { componentRef: ComponentRef<any> }) {
        this.childValueAccessor = componentRef.instance as ControlValueAccessor;

        //replay calls to value accessor
        this.childValueAccessor.registerOnChange(this._onChange);
        this.childValueAccessor.registerOnTouched(this._onTouched);

        this.childValueAccessor.writeValue(this.value());
        this.childValueAccessor.setDisabledState?.(this.isDisabled());
    }
}
