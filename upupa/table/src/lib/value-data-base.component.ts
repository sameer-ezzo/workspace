import { Component, effect, inject, input, model, output, SimpleChanges } from '@angular/core';
import { BehaviorSubject, debounceTime, Observable, switchMap } from 'rxjs';
import { DataComponentBase } from './data-base.component';
import { FormControl, NG_VALUE_ACCESSOR, NgControl, UntypedFormControl } from '@angular/forms';
import { ControlValueAccessor } from '@angular/forms';
import { forwardRef } from '@angular/core';
import { OnChanges } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NormalizedItem } from '@upupa/data';

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
    viewDataSource$ = new BehaviorSubject<'adapter' | 'selected'>(this.loadingMode() === 'eager' ? 'adapter' : 'selected');
    items$: Observable<NormalizedItem<T>[]> = this.viewDataSource$.pipe(switchMap((view) => (view === 'adapter' ? this.adapter().normalized$ : this.selectedNormalized$)));

    _ngControl = inject(NgControl, { optional: true }); // this won't cause circular dependency issue when component is dynamically created
    _control = this._ngControl?.control as UntypedFormControl; // this won't cause circular dependency issue when component is dynamically created
    _defaultControl = new FormControl();
    control = input<FormControl>(this._control ?? this._defaultControl);
    handleUserInput(v: Partial<T> | Partial<T>[]) {
        if (v === undefined) {
            this.selectionModel.clear(false);
            this.value.set(undefined);
        } else this.value.set(v);

        if (this._ngControl) {
            // only notify changes if control was provided externally
            this.markAsTouched();
            this.propagateChange();
        } else {
            this.control().setValue(this.value());
        }
    }
    constructor() {
        super();
        effect(() => {
            const mode = this.loadingMode();
            const firstLoad = this.firstLoad() === true;
            if (firstLoad && mode === 'eager' && this.viewDataSource$.value === 'selected') {
                this.viewDataSource$.next('adapter');
                this.refreshData();
            } else if (firstLoad && mode === 'lazy' && this.viewDataSource$.value === 'adapter') this.viewDataSource$.next('selected');
        });
        effect(() => {
            const v = this.value();
            if (v === undefined) return;
            const v_arr = Array.isArray(v) ? v : [v];
            const keys = this.adapter().getKeysFromValue(v_arr);
            this.selectionModel.clear(false);

            this.adapter()
                .getItems(keys)
                .then((items) => {
                    this.selectedNormalized = items ?? [];
                    this.singleSelected.set(this.selectedNormalized?.[0]?.key);
                });
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
