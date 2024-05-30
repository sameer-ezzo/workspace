import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, forwardRef } from '@angular/core'
import { AbstractControl, ControlValueAccessor, NG_VALIDATORS, UntypedFormControl, ValidationErrors, Validator } from '@angular/forms'
import { BehaviorSubject } from 'rxjs'

@Component({
    selector: 'input-base',
    template: '',
    providers: [
        { provide: NG_VALIDATORS, useExisting: forwardRef(() => InputBaseComponent), multi: true }
    ]
})

export class InputBaseComponent<T = any, C = UntypedFormControl> implements ControlValueAccessor, Validator, OnChanges {

    @Input() name = `${Date.now()}`
    @Input() control: UntypedFormControl = new UntypedFormControl()
    @Output() valueChange = new EventEmitter<T | T[]>()
    value1$ = new BehaviorSubject<T>(undefined)

    @Input()
    public get value(): T { return this.value1$.value }
    public set value(v: T) { this.writeValue(v, true) }

    public get _value(): T { return this.value1$.value }
    public set _value(v: T) { this.writeValue(v, false) }

    //ControlValueAccessor
    _onChange: ((value: T | T[]) => void)
    _onTouch: (() => void)

    validate(control: AbstractControl): ValidationErrors {
        return control.validator ? control.validator(control) : null
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    _updateViewModel() { }

    _propagateChange() {
        if (this._onChange) this._onChange(this.value) //ngModel/ngControl notify (value accessor)
        this.valueChange.emit(this.value) //value event binding notify
    }


    ngOnChanges(changes: SimpleChanges): void {
        if (changes['control']) {
            this._value = this.control?.value //read value from control (but why not write value to control?)
            this.control?.registerOnChange((value: T) => this._value = value)
        }
    }


    writeValue(v: T, emitEvent = false): void {

        if (v === this.value) return
        this.value1$.next(v)

        this.control?.setValue(v, { emitEvent })

        this._updateViewModel()
        if (emitEvent) this._propagateChange()
    }

    onTouch() {
        this.control?.markAsTouched()
        if (this._onTouch) this._onTouch()
    }
    registerOnChange(fn: (value: T) => void): void { this._onChange = fn }
    registerOnTouched(fn: () => void): void { this._onTouch = fn }
    setDisabledState?(isDisabled: boolean): void {
        if (isDisabled && this.control?.enabled) this.control?.disable()
        else if (isDisabled === false && this.control?.disabled) this.control?.enable()
    }
}



@Component({
    selector: 'input-base',
    template: `
    @if (label) {
      <label>label</label>
    }
    <input #input [type]="type" [value]="value || ''" (input)="value = $event.target?.['value']; _propagateChange();control.markAsDirty()" (blur)="onTouch();" [readonly]="readonly" [placeholder]="placeholder" [required]="required">
    @for (error of control?.errors | keyvalue; track error) {
      <span class="error">{{errorMessages[error.key+''] || error.key}}</span>
    }
    `
})

export class BaseTextInputComponent<T = any> extends InputBaseComponent<T>{
    inlineError = true;

    @Input() placeholder: string;
    @Input() type = 'text';
    @Input() label: string;
    @Input() hint: string;
    private _readonly = false;
    @Input()
    public get readonly() {
        return this._readonly;
    }
    public set readonly(value) {
        this._readonly = value;
        this.setDisabledState(value === true)
    }
    @Input() errorMessages: { [errorCode: string]: string } = {};
    @Input() required: boolean;

    override ngOnChanges(changes: SimpleChanges): void {
        super.ngOnChanges(changes)
        this.setDisabledState(this.readonly === true)
    }
}