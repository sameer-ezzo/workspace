import { Component, Input, forwardRef } from '@angular/core';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { DataComponentBase } from '@upupa/table';
import { InputDefaults } from '../defaults';

@Component({
  selector: 'form-autocomplete-text',
  templateUrl: './autocomplete-text.component.html',
  providers: [
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => AutoCompleteTextComponent), multi: true },
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => AutoCompleteTextComponent), multi: true }
  ]
})
export class AutoCompleteTextComponent extends DataComponentBase<string> {
  inlineError = true;

  @Input() appearance = InputDefaults.appearance;
  @Input() floatLabel = InputDefaults.floatLabel;
  @Input() label;
  @Input() required;
  @Input() panelClass;
  @Input() placeholder;
  @Input() hint;
  @Input() errorMessages = {};

  _onlySelected = false;

 override ngOnInit() {
    this._value ??= '';
    super.ngOnInit();
  }

  _valueChanged(value: any) {
    this._value = value;
    this.q = value as string;
    this.adapter.refresh()
    this._propagateChange();
    this.control.markAsDirty()
  }

  optionSelected(option: MatAutocompleteSelectedEvent) {
    this._valueChanged(option.option.value)
  }
}

