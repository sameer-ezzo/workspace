import { Component, Input, forwardRef, input } from '@angular/core';
import {
    ControlValueAccessor,
    NG_VALIDATORS,
    NG_VALUE_ACCESSOR,
    UntypedFormControl,
} from '@angular/forms';
import { InputDefaults } from '../defaults';

@Component({
    selector: 'form-text-area',
    templateUrl: './text-area.component.html',
    styleUrls: ['./text-area.component.css'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => TextAreaComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => TextAreaComponent),
            multi: true,
        },
    ],
})
export class TextAreaComponent implements ControlValueAccessor {
    inlineError = true;

    appearance = input(InputDefaults.appearance);
    floatLabel = input(InputDefaults.floatLabel);
    placeholder = input('');

    label = input('');
    hint = input('');
    readonly = input(false);
    errorMessages = input<{ [errorCode: string]: string }>({});

    cdkAutosizeMinRows = input<number>(3);
    // , {
    //     transform: (v: number) => Math.max(1, v),
    // });
    cdkAutosizeMaxRows = input<number>(5);
    // , {
    //     transform: (v: number) => Math.max(1, v),
    // });
    cdkTextareaAutosize = input<boolean>(true);
    control = input<UntypedFormControl>();

    _onChangeHandlers: ((value: string) => void)[] = [];
    _onTouchHandlers: (() => void)[] = [];
    onChange(_value: string) {
        this._onChangeHandlers.forEach((h) => h(_value));
    }
    onTouch() {
        this._onTouchHandlers.forEach((h) => h());
    }

    private _value: string;

    @Input()
    get value(): string {
        return this._value;
    }
    set value(value: string) {
        if (this._value !== value) {
            this._value = value;
            this.onChange(this._value);
        }
    }

    writeValue(value: string): void {
        this.value = value;
    }
    registerOnChange(fn: (value: string) => void): void {
        this._onChangeHandlers.push(fn);
    }
    registerOnTouched(fn: () => void): void {
        this._onTouchHandlers.push(fn);
    }
    setDisabledState?(isDisabled: boolean): void {
        const control = this.control();
        if (isDisabled && control.enabled) control.disable();
        else if (isDisabled === false && control.disabled) control.enable();
    }

    inputChange(target: EventTarget) {
        const value = (target as HTMLInputElement).value;
        this.value = value;
        this.control().markAsTouched();
        this.control().markAsDirty();
    }
}
