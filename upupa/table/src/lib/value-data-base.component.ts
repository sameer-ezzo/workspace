import { Component, inject, input, model, output } from '@angular/core';
import { debounceTime } from 'rxjs';
import { DataComponentBase } from './data-base.component';
import { FormControl, NG_VALUE_ACCESSOR, NgControl, UntypedFormControl } from '@angular/forms';
import { ControlValueAccessor } from '@angular/forms';
import { forwardRef } from '@angular/core';
import { OnChanges } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'value-data-base',
    template: '',
    styles: [],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => ValueDataComponentBase),
            multi: true,
        },
    ],
})
export class ValueDataComponentBase<T = any> extends DataComponentBase<T> implements ControlValueAccessor, OnChanges {
    name = input<string, string>('', {
        alias: 'fieldName',
        transform: (v) => (v ? v : `field_${Date.now()}`),
    });

    valueChange = output<Partial<T> | Partial<T>[]>();
    required = input<boolean>(false);
    disabled = model(false);
    value = model<Partial<T> | Partial<T>[]>(undefined);

    _control = inject(NgControl, { optional: true }).control as UntypedFormControl; // this won't cause circular dependency issue when component is dynamically created
    control = input<FormControl>(this._control ?? new FormControl());

    handleUserInput(v: Partial<T> | Partial<T>[]) {
        this.value.set(v);
        this.markAsTouched();
        this.propagateChange();
    }

    override ngOnInit(): void {
        super.ngOnInit();

        this.selectionModel.changed.pipe(debounceTime(50), takeUntilDestroyed(this.destroyRef)).subscribe(async (s) => {
            const selectedNormalized = await this.adapter().getItems(s.source.selected);
            this.selectedNormalized = selectedNormalized;
            const v = this.value();
            const value = Array.isArray(v) ? v : [v];
            if (this.maxAllowed() === 1) {
                const valueKey = this.adapter().getKeysFromValue(value.slice(0, 1))?.[0];
                const selectedKey = selectedNormalized?.[0]?.key;
                if (valueKey === selectedKey) return;
                this.handleUserInput(selectedNormalized?.[0]?.value);
            } else {
                const valueKeys = this.adapter().getKeysFromValue(value);
                const selectedKeys = selectedNormalized?.map((x) => x.key);
                const set = new Set([...valueKeys, ...selectedKeys]);
                if (selectedKeys.length === valueKeys.length && valueKeys.length === set.size) return;
                this.handleUserInput(selectedNormalized?.map((x) => x.value));
            }
        });
    }

    // >>>>> ControlValueAccessor ----------------------------------------
    _onChange: (value: Partial<T> | Partial<T>[]) => void;
    _onTouch: () => void;

    propagateChange() {
        this._onChange?.(this.value()); //ngModel/ngControl notify (value accessor)
    }

    markAsTouched() {
        if (this._onTouch) this._onTouch();
    }

    writeValue(v: Partial<T> | Partial<T>[]): void {
        this.value.set(v);
    }

    registerOnChange(fn: (value: Partial<T> | Partial<T>[]) => void): void {
        this._onChange = fn;
    }
    registerOnTouched(fn: () => void): void {
        this._onTouch = fn;
    }
    setDisabledState?(isDisabled: boolean): void {
        this.disabled.set(isDisabled);
    }
}
