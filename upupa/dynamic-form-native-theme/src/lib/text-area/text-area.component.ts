import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALIDATORS, NG_VALUE_ACCESSOR, UntypedFormControl } from '@angular/forms';
import { InputDefaults } from '../defaults';

;


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
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => TextAreaComponent), multi: true }
  ]
})
export class TextAreaComponent implements ControlValueAccessor {
  inlineError = true;

  @Input() appearance = InputDefaults.appearance;
  @Input() floatLabel = InputDefaults.floatLabel;
  @Input() placeholder: string;


  @Input() label: string;
  @Input() hint: string;
  @Input() readonly = false;
  @Input() errorMessages: { [errorCode: string]: string } = {};


  @Input() cdkAutosizeMinRows: number = 3;
  @Input() cdkAutosizeMaxRows: number = 5;
  @Input() cdkTextareaAutosize: boolean = true;

  @Input() control: UntypedFormControl;
  _onChangeHandlers: ((value: string) => void)[] = [];
  _onTouchHandlers: (() => void)[] = [];
  onChange(_value: string) { this._onChangeHandlers.forEach(h => h(_value)) };
  onTouch() { this._onTouchHandlers.forEach(h => h()) };

  private _value: string;

  @Input()
  get value(): string { return this._value }
  set value(value: string) {
    if (this._value !== value) {
      this._value = value;
      this.onChange(this._value);
    }
  }

  writeValue(value: string): void { this.value = value; }
  registerOnChange(fn: (value: string) => void): void { this._onChangeHandlers.push(fn); }
  registerOnTouched(fn: () => void): void { this._onTouchHandlers.push(fn); }
  setDisabledState?(isDisabled: boolean): void {
    if (isDisabled && this.control.enabled) this.control.disable();
    else if (isDisabled === false && this.control.disabled) this.control.enable();
  }

  inputChange(target: EventTarget) {
    const value = (target as HTMLInputElement).value;
    this.value = value;
    this.control.markAsTouched()
    this.control.markAsDirty()
  }
}


