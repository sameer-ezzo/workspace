import { Component, inject, input, model } from '@angular/core';
import { ControlValueAccessor, FormControl, NgControl, UntypedFormControl } from '@angular/forms';

@Component({ template: '' })
export class InputBaseComponent<T = any> implements ControlValueAccessor {
    name = input<string, string>(`field_${Date.now()}`, {
        alias: 'fieldName',
        transform: (v) => {
            return v ? v : `field_${Date.now()}`;
        },
    });
    disabled = model(false);
    required = input(false);
    value = model<T>();

    _ngControl = inject(NgControl, { optional: false }); // this won't cause circular dependency issue when component is dynamically created
    _control = this._ngControl?.control as UntypedFormControl; // this won't cause circular dependency issue when component is dynamically created
    _defaultControl = new FormControl();
    control = input<FormControl>(this._control ?? this._defaultControl);
    handleUserInput(v: T) {
        this.value.set(v);

        if (this._ngControl) {
            // only notify changes if control was provided externally
            this.markAsTouched();
            this.propagateChange();
        } else {
            this.control().setValue(v);
        }
    }

    // >>>>> ControlValueAccessor ----------------------------------------
    _onChange: (value: T) => void;
    _onTouch: () => void;

    propagateChange() {
        this._onChange?.(this.value());
    }

    markAsTouched() {
        if (this._onTouch) this._onTouch();
    }

    writeValue(v: T): void {
        this.value.set(v);
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
}
