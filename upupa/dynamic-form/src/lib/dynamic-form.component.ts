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
    computed,
    Injector,
    model,
    Pipe,
    effect,
    InjectionToken,
    signal,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor, AbstractControl, NgForm, UntypedFormBuilder, ValueChangeEvent } from '@angular/forms';
import { FormScheme } from './types';
import { Condition } from '@noah-ark/expression-engine';
import { Subscription } from 'rxjs';
import { EventBus } from '@upupa/common';
import { ChangeFormSchemeHandler, ChangeInputsHandler, ChangeStateHandler, ChangeValueHandler, InputVisibilityHandler } from './events/handlers';
import { JsonPointer, Patch } from '@noah-ark/json-patch';
import { DynamicFormModuleOptions } from './dynamic-form.options';
import { DYNAMIC_FORM_OPTIONS } from './di.token';
import { DynamicFormBuilder } from './dynamic-form-renderer';
import { FieldFormControl, FieldFormGroup } from './field-form.control';
import { DynamicFormService } from './dynamic-form.service';
import { ConditionalLogicService } from './conditional-logic.service';
import { DialogService } from '@upupa/dialog';
import { KeyValuePipe } from '@angular/common';

export type FormGraph = Map<string, FieldFormControl | FieldFormGroup>;
export const FORM_GRAPH = new InjectionToken<FormGraph>('FormControls');
export class ExtendedValueChangeEvent<T = any> {
    get path() {
        return this.source?.path ?? '/';
    }
    constructor(
        public readonly value: T,
        public readonly graph: FormGraph,
        public readonly source?: FieldFormControl | FieldFormGroup,
        public readonly patch?: Record<`/${string}`, unknown>,
    ) {}
}

export function injectField(path: string): FieldFormControl | FieldFormGroup {
    return inject(FORM_GRAPH, { optional: true })?.get(path);
}
@Component({
    // eslint-disable-next-line @angular-eslint/component-selector
    selector: 'dynamic-form',
    templateUrl: './dynamic-form.component.html',
    styleUrls: ['./dynamic-form.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => DynamicFormComponent),
            multi: true,
        },
        {
            provide: DynamicFormBuilder,
            useFactory: (formService: DynamicFormService) => new DynamicFormBuilder(formService),
            deps: [UntypedFormBuilder, DynamicFormService, EventBus],
        },
        {
            provide: FORM_GRAPH,
            useFactory: (form: DynamicFormComponent) => form.graph(),
            deps: [DynamicFormComponent],
        },
    ],
    host: {
        '[class]': "'dynamic-form' + class()",
        '[attr.name]': 'hostName()',
    },
})
export class DynamicFormComponent<T = any> implements ControlValueAccessor, OnDestroy, OnChanges {
    public readonly el = inject(ElementRef);
    public readonly renderer = inject(Renderer2);
    public readonly conditionalService = inject(ConditionalLogicService);
    public readonly bus = inject(EventBus);
    public readonly dialog = inject(DialogService);
    public readonly options: DynamicFormModuleOptions = inject(DYNAMIC_FORM_OPTIONS);
    private _patches: {};

    get patches(): Patch[] {
        return Object.entries(this._patches).map(([path, value]) => ({ path, op: 'replace', value }));
    }

    fields = input.required<FormScheme>();

    conditions = input<Condition[]>([]);
    name = input<string>(Date.now().toString(), { alias: 'formName' });
    hostName = computed(() => `dynForm_${this.name()}`);
    disabled = input(false);
    readonly = input(false);
    class = input('');
    theme = input<string>('material');

    ngForm = viewChild.required<NgForm>('dynForm');
    form = computed(() => this.ngForm().form);

    value = model(undefined);

    fieldValueChange = output<ExtendedValueChangeEvent<T>>();

    submit = output<DynamicFormComponent>();
    preventDirtyUnload = input(false);

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
        return this.form()?.invalid;
    }
    get valid() {
        return this.form()?.valid;
    }

    propagateChange() {
        this._onChange?.(this.value());
    }

    graph = signal<FormGraph>(null);

    formService = inject(DynamicFormService);
    _builder = new DynamicFormBuilder(this.formService);

    constructor() {
        effect(() => {
            this.form().events.subscribe((e) => {
                if (e instanceof ValueChangeEvent) {
                    const value = this.value();
                    const source = e.source as FieldFormControl | FieldFormGroup;
                    const path = source.path ?? '/';
                    JsonPointer.set(value, path, source.value);
                    let patch = undefined;
                    if (source.path) {
                        patch = { [source.path]: source.value };
                        this._patches[source.path] = source.value;
                    }

                    this.value.set(value);
                    this.propagateChange();

                    const ee = new ExtendedValueChangeEvent(value, this.graph(), source.path ? source : undefined, patch);
                    this.fieldValueChange.emit(ee);
                    console.log('valueChanges', ee);
                }
            });
        });
    }

    async ngOnChanges(changes: SimpleChanges): Promise<void> {
        if (changes['name'] && !changes['name'].firstChange) {
            throw `Name cannot be changed after initialized ${this.name()}`;
        }

        if (changes['fields']) {
            const scheme = this.fields();
            if (typeof scheme !== 'object' || Array.isArray(scheme)) throw new Error('fields must be passed as dictionary format');

            this._patches = {};
            this.graph.set(this._builder.build(this.form(), this.fields(), this.value()));

            // emit initial value change event
            this.fieldValueChange.emit(new ExtendedValueChangeEvent(this.value(), this.graph()));

            //handlers
            this.subs?.forEach((s) => s.unsubscribe());
            this.subs = [InputVisibilityHandler(this), ChangeFormSchemeHandler(this), ChangeInputsHandler(this), ChangeValueHandler(this), ChangeStateHandler(this)];
        }
        if (changes['value']) {
            if (this.value() === undefined || this.value() === null) this.value.set({});
            this._patches = {};
            this.form().patchValue(this.value());
        }

        if (changes['conditions']?.firstChange === true) {
            const { currentValue, previousValue } = changes['conditions'];
            if (previousValue?.length) previousValue.forEach((c) => this.conditionalService.removeCondition(c));
            if (currentValue?.length) currentValue.forEach((c) => this.subs.push(this.conditionalService.addCondition(c)));
        }
    }

    injector = inject(Injector);
    ngOnInit() {}

    onSubmit(e: Event) {
        e?.stopPropagation();
        e?.preventDefault();
        if (this.form().invalid) {
            this.scrollToError();
        } else this.submit.emit(this);
    }

    _onChange: (value: T) => void;
    _onTouched: () => void;

    writeValue(val: T): void {
        if (this.options.enableLogs === true) console.log(`%c dynamic writing! (name:${this.name()})`, 'background: #0065ff; color: #fff', val);
        this.form().patchValue(val);
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
        if (this.options.enableLogs === true) console.log(`%c scheme changed! (name:${this.name()})`, 'background: #ff6b00; color: #fff', this.fields());
        // this.formRenderer.fields = Object.values(this.fields());
        // this.writeValue(this.value());
        this.propagateChange();
    }

    scrollToElement(element: HTMLElement, focus = true) {
        if (!element) return;
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (focus)
            setTimeout(() => {
                element.focus();
            }, 400); //wait scroll animation
    }
    host = inject<ElementRef<HTMLElement>>(ElementRef);
    scrollToError() {
        const c = Array.from(this.graph()).find((c) => c[1].invalid && c[1].field().ui?.hidden !== true);
        if (!c) return;
        const control = c[1] as FieldFormControl;
        control.markAsTouched();
        const el = this.host.nativeElement.querySelector(`[name=${control.name}]`) as HTMLElement;
        if (el) this.scrollToElement(el);
    }

    getDirtyPatches(): Patch[] {
        return Array.from(this.graph())
            .filter((e) => (e[1] as AbstractControl).dirty)
            .map((e) => {
                const path = e[1]?.['path'];
                return {
                    path,
                    op: 'replace',
                    value: JsonPointer.get(this.value(), path),
                } as Patch;
            });
    }

    getDirtyValue(): Record<string, any> {
        const dirty = {};
        const dirtyControls = Array.from(this.graph()).filter((e) => (e[1] as AbstractControl).dirty);
        if (dirtyControls.length === 0) return null;

        dirtyControls.map((e) => e[1]?.['path']).forEach((p) => JsonPointer.set(dirty, p, JsonPointer.get(this.value(), p)));
        return dirty;
    }

    @HostListener('window:beforeunload', ['$event'])
    beforeunloadHandler(event) {
        if (this.preventDirtyUnload() === true && this.dirty) {
            event.preventDefault();
            event.returnValue = true;
        }
    }

    ngOnDestroy(): void {
        this.subs.forEach((s) => s.unsubscribe());
        this.form().reset();
    }
}

@Pipe({
    name: 'orderedKeyValue',
    pure: true,
})
export class OrderedKeyValuePipe extends KeyValuePipe {
    override transform(value: any, ...args: any[]): any {
        return Object.keys(value).map((key) => ({ key, value: value[key] }));
    }
}
