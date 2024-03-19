import { Component, EventEmitter, Input, Output, SimpleChanges, forwardRef, ElementRef, ViewChild, OnDestroy, OnInit, OnChanges, ViewEncapsulation, Renderer2, Inject, HostListener, inject, HostBinding } from "@angular/core"
import { NG_VALUE_ACCESSOR, ControlValueAccessor, AbstractControl, NgForm, UntypedFormBuilder, NG_VALIDATORS } from "@angular/forms"
import { Field, FormScheme } from "./types"
import { Condition } from "@noah-ark/expression-engine"
import { Subscription } from "rxjs"
import { DialogService, EventBus } from '@upupa/common'
import { ChangeFormSchemeHandler, ChangeInputsHandler, ChangeStateHandler, ChangeValueHandler, InputVisibilityHandler } from "./events/handlers"
import { JsonPointer, Patch } from "@noah-ark/json-patch"
import { LanguageService } from "@upupa/language"
import { DynamicFormOptions } from "./dynamic-form.options"
import { DYNAMIC_FORM_OPTIONS } from "./di.token"
import { DynamicFormRenderer } from "./dynamic-form-renderer"
import { DynamicFormService } from "./dynamic-form.service"
import { ConditionalLogicService } from "./conditional-logic.service"

@Component({
    // eslint-disable-next-line @angular-eslint/component-selector
    selector: "dynamic-form",
    templateUrl: './dynamic-form.component.html',
    styleUrls: ['./dynamic-form.component.scss'],
    encapsulation: ViewEncapsulation.None,
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DynamicFormComponent), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => DynamicFormComponent), multi: true }
    ]
})
export class DynamicFormComponent<T = any> implements ControlValueAccessor, OnDestroy, OnInit, OnChanges {
    formRenderer!: DynamicFormRenderer

    public readonly el = inject(ElementRef)
    public readonly renderer = inject(Renderer2)
    public readonly conditionalService = inject(ConditionalLogicService)
    public readonly fb = inject(UntypedFormBuilder)
    public readonly bus = inject(EventBus)
    public readonly dialog = inject(DialogService)
    protected readonly formService = inject(DynamicFormService)
    public readonly options: DynamicFormOptions = inject(DYNAMIC_FORM_OPTIONS)

    @Input()
    @HostBinding('class')
    class = undefined

    @Input() preventDirtyUnload = undefined
    @Input() recaptcha: string
    @Input() fields: FormScheme
    @Input() conditions: Condition[]
    @Input()
    @HostBinding('attr.name')
    name = `${Math.round(1000 * Math.random())}`
    // eslint-disable-next-line @angular-eslint/no-output-native
    @Output() submit = new EventEmitter<DynamicFormComponent>()

    private _theme!: string
    @Input()
    public get theme(): string {
        return this._theme;
    }
    public set theme(v: string) {
        if (!v || this._theme === v) return;

        this._theme = v || this.formService.defaultThemeName;
        if (this.formRenderer) this.formRenderer = new DynamicFormRenderer(this.formService, this._theme, this.bus, this.fb, this.dialog, this, this.renderer)
    }

    @Input() initialValueFactory: () => Promise<T>


    @ViewChild('dynForm') formElement: NgForm;
    @Input() control: AbstractControl;
    @Output() valueChange = new EventEmitter<T>();

    _value: T;
    @Input()
    get value() { return this._value; }
    set value(val: T) { this.writeValue(val); }

    _onChange: (value: T) => void;
    _onTouched: () => void;
    get dirty() { return this.formElement?.dirty; }
    set dirty(v: boolean) { if (v) this.formElement.control.markAsDirty(); else this.formElement.control.markAsPristine(); }
    get pristine() { return this.formElement?.pristine; }
    set pristine(v: boolean) { this.dirty = !v; }
    get touched() { return this.formElement?.touched; }
    set touched(v: boolean) { if (v) this.formElement.control.markAsTouched(); else this.formElement.control.markAsUntouched(); }
    get untouched() { return this.formElement?.untouched; }
    set untouched(v: boolean) { this.touched = !v }

    subs: Subscription[] = []

    markAsDirty() { this.dirty = true }
    markAsPristine() { this.pristine = true }
    markAsTouched() { this.touched = true }
    markAsUntouched() { this.untouched = true }

    get invalid() { return this.formElement?.invalid }
    get valid() { return this.formElement?.valid }

    _keys(x) { return Object.keys(x) }
    _values(x) { return Object.values(x) }


    get controls() { return this.formRenderer.controls }

    constructor() {

        this.formRenderer = new DynamicFormRenderer(this.formService, this.theme, this.bus, this.fb, this.dialog, this, this.renderer)
        this.theme = this.formService.defaultThemeName || 'native'

        //handlers
        this.subs = [
            InputVisibilityHandler(this),
            ChangeFormSchemeHandler(this),
            ChangeInputsHandler(this),
            ChangeValueHandler(this),
            ChangeStateHandler(this)
        ]
    }




    ngOnInit() {
        this.formRenderer.value$.subscribe(v => {
            this._value = v;
            this._propagateChange();
        });
    }

    async ngOnChanges(changes: SimpleChanges): Promise<void> {
        if (changes['name'] && !changes['name'].firstChange) {
            throw `Name cannot be changed after initialized ${this.name}`
        }

        if (changes['initialValueFactory']?.isFirstChange && typeof this.initialValueFactory === 'function')
            this._value = await this.initialValueFactory()

        if (changes['fields']) {
            if (typeof this.fields !== 'object' || Array.isArray(this.fields))
                throw new Error('fields must be passed as dictionary format')

            this._fieldsChanged()
        }

        if (changes['conditions']) {
            const currentValue = changes['conditions'].currentValue as Condition[]
            const previousValue = changes['conditions'].previousValue as Condition[]

            if (previousValue?.length) previousValue.forEach(c => this.conditionalService.removeCondition(c))
            if (currentValue?.length) currentValue.forEach(c => this.subs.push(this.conditionalService.addCondition(c)))
        }
    }


    onSubmit(e: Event) {
        e.stopPropagation();
        e.preventDefault();
        if (this.formElement.invalid) {
            this.scrollToError();
        }
        else this.submit.emit(this);
    }




    writeValue(val: T): void {
        if (val === this.value) return;
        if (this.options.enableLogs === true) console.log(`%c dynamic writing! (name:${this.name})`, 'background: #0065ff; color: #fff', val);
        this._value = val;
        this.formRenderer.writeValue(val);
        this.control?.setValue(val, { emitEvent: false, onlySelf: true });
    }



    _propagateChange() {
        const value = this._value;
        if (this._onChange) this._onChange(value); //ngModel/ngControl notify (value accessor)
        if (this.control) this.control.setValue(value); //control notify
        this.valueChange.emit(value); //value event binding notify
    }

    registerOnChange(fn: (model: any) => void): void { this._onChange = fn; }
    registerOnTouched(fn: () => void): void { this._onTouched = fn; }
    setDisabledState?(isDisabled: boolean): void {
        if (isDisabled) this.formRenderer.form.disable()
        else this.formRenderer.form.enable();
    }


    _fieldsChanged() {
        if (this.options.enableLogs === true) console.log(`%c scheme changed! (name:${this.name})`, 'background: #ff6b00; color: #fff', this.fields);
        this.formRenderer.fields = Object.values(this.fields);
        this.writeValue(this._value);
        this._propagateChange();
    }

    scrollToElement(element: HTMLElement, focus = true) {
        if (!element) return
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (focus) setTimeout(() => { element.focus(); }, 400); //wait scroll animation
    }
    scrollToError() {
        const c = Array.from(this.formRenderer.controls).filter(c => c[1].invalid && c[0].ui?.hidden !== true)?.[0]
        if (!c) return
        c[1].markAsTouched();
        const el = document.getElementById(c[0].name) ?? <HTMLElement>(document.querySelector('form :not(fieldset).ng-touched.ng-invalid'));
        if (el) this.scrollToElement(el);
    }


    getDirtyPatches(): Patch[] {
        return Array.from(this.formRenderer.controls).filter(e => (e[1] as AbstractControl).dirty).map(e => {
            const path = (e[0] as Field)?.path
            return { path, op: 'replace', value: JsonPointer.get(this.value, path) } as Patch
        })
    }
    getDirtyValue(): Record<string, any> {
        const dirty = {}
        const dirtyControles = Array.from(this.formRenderer.controls).filter(e => (e[1] as AbstractControl).dirty)
        if (dirtyControles.length === 0) return null

        dirtyControles.map(e => (e[0] as Field)?.path).forEach(p => JsonPointer.set(dirty, p, JsonPointer.get(this.value, p)))
        return dirty
    }


    @HostListener('window:beforeunload', ['$event'])
    beforeunloadHandler(event) {
        if (this.preventDirtyUnload === true && this.dirty) {
            event.preventDefault();
            event.returnValue = true;
        }
    }

    ngOnDestroy(): void {
        this.subs.forEach(s => s.unsubscribe());
        this.formRenderer.destroy();
    }
}

//parent component ==(write)=> [don't notify parent again to avoid echos] (@Input / NgModel / Property set / control.setValue)
//internal state ==(write)=> [do notify parent] (field / internal events)

// export class PreventUnload {
//     static prevent(msg = "Unsaved changes!") {
//         window.onbeforeunload = () => msg;
//     }
// }