import { Component, computed, effect, inject, input, model, output, signal } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged, of, switchMap } from 'rxjs';
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

    loadingMode = input<'lazy' | 'eager'>('lazy');
    readonly viewDataSource = new BehaviorSubject<'adapter' | 'selected'>('selected');
    items = this.viewDataSource.pipe(
        distinctUntilChanged(),
        switchMap((vds) => {
            if (vds === 'adapter') return this.adapter().normalized$;
            return this.selectedNormalized;
        }),
    );

    compareWithFn = signal((optionValue: any, selectionValue: any) => {
        return optionValue === selectionValue;
    });

    _ngControl = inject(NgControl, { optional: true }); // this won't cause circular dependency issue when component is dynamically created
    _control = this._ngControl?.control as UntypedFormControl; // this won't cause circular dependency issue when component is dynamically created
    _defaultControl = new FormControl();
    control = input<FormControl>(this._control ?? this._defaultControl);

    constructor() {
        super();
        effect(
            () => {
                const adapter = this.adapter();
                const keyProperty = adapter?.keyProperty;
                if (keyProperty) {
                    this.compareWithFn.set((optionValue: any, selectionValue: any) => {
                        if (optionValue === undefined || selectionValue === undefined) return false;
                        return optionValue[keyProperty] === selectionValue?.[keyProperty];
                    });
                } else {
                    this.compareWithFn.set((optionValue: any, selectionValue: any) => {
                        return optionValue === selectionValue;
                    });
                }
            },
            { allowSignalWrites: true },
        );
        effect(() => {
            if (this.loadingMode() !== 'eager') return;
            this.viewDataSource.next('adapter');
            this.refreshData();
        });

        effect(() => {
            const control = this.control();
            if (control) {
                control.valueChanges.pipe(takeUntilDestroyed(this.destroyRef), distinctUntilChanged()).subscribe((v) => {
                    this.writeValue(v);
                });
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
        this.selectionModel.clear();
        if (v != undefined) this.select(v);
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
