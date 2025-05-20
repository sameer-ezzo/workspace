import { Component, inject, input, model } from "@angular/core";
import { ControlValueAccessor, FormControl, FormGroup, NgControl, UntypedFormControl } from "@angular/forms";

export function _defaultControl(parentComponent: any) {
    const control = new FormControl();
    control["_parentComponent"] = parentComponent;
    return control;
}

export function _defaultForm(parentComponent: any) {
    const control = new FormGroup({});
    control["_parentComponent"] = parentComponent;
    return control;
}

@Component({ standalone: true, template: "" })
export class InputBaseComponent<T = any> implements ControlValueAccessor {
    name = input<string, string>(`field_${Date.now()}`, {
        alias: "fieldName",
        transform: (v) => {
            return v ? v : `field_${Date.now()}`;
        },
    });
    disabled = model(false);
    required = input(false);
    attributes = input<{ attribute: string; value: string }[], Record<string, string>>([], {
        transform: (attrs: Record<string, string>) => {
            if (!attrs) return [];
            const entries = Object.entries(attrs);
            if (!entries.length) return [];

            const atts = entries
                .filter(([attribute, value]) => value != null)
                .reduce((acc, [attribute, value]) => {
                    acc.push({ attribute, value: value });
                    return acc;
                }, []);

            return atts;
        },
    });

    value = model<T>();
    _ngControl = inject(NgControl, { optional: true }); // this won't cause circular dependency issue when component is dynamically created
    _control = this._ngControl?.control as FormControl; // this won't cause circular dependency issue when component is dynamically created
    _defaultControl = _defaultControl(this);
    control = input<FormControl>(this._control ?? this._defaultControl);
    handleUserInput(v: T) {
        this.value.set(v);

        if (this._ngControl) {
            // only notify changes if control was provided externally
            this.markAsTouched();
            this.propagateChange();
        } else {
            const control = this.control();
            if (control && control.value !== v) control.setValue(v);
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
