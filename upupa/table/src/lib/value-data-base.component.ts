import { Component, Input, Output, EventEmitter, SimpleChanges } from "@angular/core";
import { BehaviorSubject, debounceTime } from "rxjs";
import { DataComponentBase } from "./data-base.component";
import { FormControl } from "@angular/forms";
import { ControlValueAccessor } from "@angular/forms";
import { NG_VALIDATORS } from "@angular/forms";
import { forwardRef } from "@angular/core";
import { Validator } from "@angular/forms";
import { OnChanges } from "@angular/core";
import { ValidationErrors } from "@angular/forms";
import { AbstractControl } from "@angular/forms";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { logger, Logger } from "@upupa/common";




@Component({
    selector: 'value-data-base',
    template: '',
    styles: [],
    providers: [
        { provide: NG_VALIDATORS, useExisting: forwardRef(() => ValueDataComponentBase), multi: true }
    ]
})
export class ValueDataComponentBase<T = any> extends DataComponentBase<T> implements ControlValueAccessor, Validator, OnChanges {

    @Input() name = `${Date.now()}`

    @Input() control = new FormControl<Partial<T> | Partial<T>[]>(undefined)
    @Output() valueChange = new EventEmitter<Partial<T> | Partial<T>[]>()
    value1$ = new BehaviorSubject<Partial<T> | Partial<T>[]>(undefined)

    @Input() required: boolean
    @Input() disabled: boolean
    @Input()
    public get value(): Partial<T> | Partial<T>[] { return this.value1$.value }
    public set value(v: Partial<T> | Partial<T>[]) { this.writeValue(v, true) }

    public get _value(): Partial<T> | Partial<T>[] { return this.value1$.value }
    public set _value(v: Partial<T> | Partial<T>[]) { this.writeValue(v, false) }


    //ControlValueAccessor
    _onChange: ((value: Partial<T> | Partial<T>[]) => void)
    _onTouch: (() => void)

    validate(control: AbstractControl): ValidationErrors | null {
        return control.validator ? control.validator(control) : null
    }


    _propagateChange() {
        if (this._onChange) this._onChange(this.value) //ngModel/ngControl notify (value accessor)
        this.valueChange.emit(this.value) //value event binding notify
    }

    override ngOnInit(): void {
        // super.ngOnInit()

        this.subscriptToFilterChanges()

        this.selectionModel.changed.pipe(
            debounceTime(50),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(async s => {
            
            const selectedNormalized = await this.adapter.getItems(s.source.selected)
            this.selectedNormalized = selectedNormalized
            const v = Array.isArray(this.value) ? this.value : [this.value]
            if (this.maxAllowed === 1) {
                const valueKey = this.adapter.getKeysFromValue(v)?.[0]
                const selectedKey = selectedNormalized?.[0]?.key
                if (valueKey === selectedKey) return
                this.value = selectedNormalized?.[0]?.value
            }
            else {
                const valueKeys = this.adapter.getKeysFromValue(v)
                const selectedKeys = selectedNormalized?.map(x => x.key)
                const set = new Set([...valueKeys, ...selectedKeys])
                if (selectedKeys.length === valueKeys.length && valueKeys.length === set.size) return
                this.value = selectedNormalized?.map(x => x.value)
            }
        })

    }
    override async ngOnChanges(changes: SimpleChanges) {
        await super.ngOnChanges(changes)
        if (changes['control']) {
            this._value = this.control?.value //read value from control (but why not write value to control?)
            this.control?.registerOnChange((value: Partial<T> | Partial<T>[]) => this._value = value)
        }
    }


    writeValue(v: Partial<T> | Partial<T>[], emitEvent = false): void {
        if (v === this.value) return
        this.value1$.next(v)
        this.control?.setValue(v, { emitEvent })

        if (this.value === undefined) this.selected = [];
        if (this.adapter) {
            const _v = (Array.isArray(this.value) ? this.value : [this.value]) as Partial<T>[];
            if (_v.length === 0) this.selected = [];
            this.selected = this.adapter.getKeysFromValue(_v);
        }
        this.singleSelected.set(this.selected?.[0])

        this._updateViewModel()

        if (emitEvent) this._propagateChange()
    }

    onTouch() {
        this.control?.markAsTouched()
        if (this._onTouch) this._onTouch()
    }
    registerOnChange(fn: (value: Partial<T> | Partial<T>[]) => void): void { this._onChange = fn }
    registerOnTouched(fn: () => void): void { this._onTouch = fn }
    setDisabledState?(isDisabled: boolean): void {
        if (isDisabled && this.control?.enabled) this.control?.disable()
        else if (isDisabled === false && this.control?.disabled) this.control?.enable()
    }


    async _updateViewModel() {
        if (this.value !== undefined && this.firstLoad()) {
            this.viewDataSource$.next('selected')
        }
    }
}
