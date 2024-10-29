import { Component, SimpleChanges, inject, input, model, output } from '@angular/core';
import { BehaviorSubject, debounceTime } from 'rxjs';
import { DataComponentBase } from './data-base.component';
import { FormControl } from '@angular/forms';
import { ControlValueAccessor } from '@angular/forms';
import { NG_VALIDATORS } from '@angular/forms';
import { forwardRef } from '@angular/core';
import { Validator } from '@angular/forms';
import { OnChanges } from '@angular/core';
import { ValidationErrors } from '@angular/forms';
import { AbstractControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'value-data-base',
    template: '',
    styles: [],
    providers: [
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => ValueDataComponentBase),
            multi: true,
        },
    ],
})
export class ValueDataComponentBase<T = any> extends DataComponentBase<T> implements ControlValueAccessor, OnChanges {
    errorMessages = model<{ [errorCode: string]: string }>(null);
    name = input<string, string>('', {
        alias: 'fieldName',
        transform: (v) => (v ? v : `field_${Date.now()}`),
    });

    valueChange = output<Partial<T> | Partial<T>[]>();
    required = input<boolean>(false);
    disabled = model(false);
    value = model<Partial<T> | Partial<T>[]>(undefined);

    _control = inject(FormControl, { optional: true });
    control = input<FormControl>(this._control ?? new FormControl());

    onInput(v: any) {
        this.value.set(v);
        this.propagateChange();
        this.markAsTouched();
    }

    override ngOnInit(): void {
        super.ngOnInit();

        this.selectionModel.changed.pipe(debounceTime(50), takeUntilDestroyed(this.destroyRef)).subscribe(async (s) => {
            const selectedNormalized = await this.adapter().getItems(s.source.selected);
            this.selectedNormalized = selectedNormalized;
            const v = this.value();
            const value = Array.isArray(v) ? v : [v];
            if (this.maxAllowed() === 1) {
                const valueKey = this.adapter().getKeysFromValue(value)?.[0];
                const selectedKey = selectedNormalized?.[0]?.key;
                if (valueKey === selectedKey) return;
                this.onInput(selectedNormalized?.[0]?.value);
            } else {
                const valueKeys = this.adapter().getKeysFromValue(value);
                const selectedKeys = selectedNormalized?.map((x) => x.key);
                const set = new Set([...valueKeys, ...selectedKeys]);
                if (selectedKeys.length === valueKeys.length && valueKeys.length === set.size) return;
                this.onInput(selectedNormalized?.map((x) => x.value));
            }
        });
    }

    _onChange: (value: Partial<T> | Partial<T>[]) => void;
    _onTouch: () => void;

    propagateChange() {
        if (this._onChange) this._onChange(this.value()); //ngModel/ngControl notify (value accessor)
        this.valueChange.emit(this.value()); //value event binding notify
    }

    writeValue(v: T): void {
        this.value.set(v);
    }

    markAsTouched() {
        if (this._onTouch) this._onTouch();
    }
    registerOnChange(fn: (value: T) => void): void {
        this._onChange = fn;
    }
    registerOnTouched(fn: () => void): void {
        this._onTouch = fn;
    }
    setDisabledState?(isDisabled: boolean): void {
        this.disabled.set(isDisabled);
    }

    private onValidatorChange = () => {};
    registerOnValidatorChange(fn: () => void): void {
        this.onValidatorChange = fn;
    }
}
