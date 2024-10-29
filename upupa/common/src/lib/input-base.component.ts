import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, computed, effect, forwardRef, inject, input, model, output } from '@angular/core';
import { AbstractControl, ControlValueAccessor, FormControl, NG_VALIDATORS, NG_VALUE_ACCESSOR, UntypedFormControl, ValidationErrors, Validator, ValidatorFn } from '@angular/forms';
import { BehaviorSubject, merge } from 'rxjs';

@Component({
    selector: 'input-base',
    template: '',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => InputBaseComponent),
            multi: true,
        }
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputBaseComponent<T = any> implements ControlValueAccessor {
    // value1$ = new BehaviorSubject<T>(undefined);

    name = input<string, string>('', {
        alias: 'fieldName',
        transform: (v) => {
            return v ? v : `field_${Date.now()}`;
        },
    });

    _control = inject(FormControl, { optional: true });
    control = input<FormControl>(this._control ?? new FormControl());





    required = input<boolean>(false);
    disabled = model(false);

    value = model<T>();

    onInput(event: any, v: any) {
        // if (event && 'stopPropagation' in event && typeof event.stopPropagation === 'function')
        //     event.stopPropagation();
        this.value.set(v);
        this.markAsTouched();
        this._propagateChange();
    }

    //ControlValueAccessor
    _onChange: (value: T | T[]) => void;
    _onTouch: () => void;


    _propagateChange() {
        if (this._onChange) this._onChange(this.value()); //ngModel/ngControl notify (value accessor)
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

}

@Component({
    selector: 'input-base',
    template: `
        @if (label()) {
        <label>{{ label() }}</label>
        }
        <input
            #input
            [type]="type()"
            [value]="value() || ''"
            (input)="onInput($event, $event.target?.['value'])"
            (blur)="markAsTouched()"
            [readonly]="readonly()"
            [placeholder]="placeholder()"
            [required]="required()"
            [formControl]="control()"
        />
        @for (error of control().errors | keyvalue; track error) {
        <span class="error">{{ error.key }}</span>
        }
    `,
})
export class BaseTextInputComponent<T = any> extends InputBaseComponent<T> {
    inlineError = true;

    placeholder = input('');
    type = input('text');
    label = input('');
    hint = input('');
    readonly = input(false);
}
