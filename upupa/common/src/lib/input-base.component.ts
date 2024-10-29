import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    OnChanges,
    Output,
    SimpleChanges,
    computed,
    effect,
    forwardRef,
    inject,
    input,
    model,
    output,
    signal,
} from "@angular/core";
import {
    AbstractControl,
    ControlValueAccessor,
    FormControl,
    NG_VALIDATORS,
    NG_VALUE_ACCESSOR,
    NgControl,
    UntypedFormControl,
    ValidationErrors,
    Validator,
    ValidatorFn,
} from "@angular/forms";
import { BehaviorSubject, merge } from "rxjs";

@Component({
    selector: "input-base",
    template: "",
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => InputBaseComponent),
            multi: true,
        },
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputBaseComponent<T = any> implements ControlValueAccessor {
    name = input<string, string>("", {
        alias: "fieldName",
        transform: (v) => {
            return v ? v : `field_${Date.now()}`;
        },
    });

    _control = inject(NgControl, { optional: true }).control as UntypedFormControl; // this won't cause circular dependency issue when component is dynamically created
    control = input<FormControl>(this._control ?? new FormControl());

    value = model<T>();
    disabled = model(false);

    handleUserInput(v: T) {
        this.value.set(v);
        this.markAsTouched();
        this.propagateChange();
    }

    // >>>>> ControlValueAccessor ----------------------------------------
    _onChange: (value: T) => void;
    _onTouch: () => void;

    propagateChange() {
        this._onChange?.(this.value()); //ngModel/ngControl notify (value accessor)
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
