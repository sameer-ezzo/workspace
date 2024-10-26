import { Component, Input, forwardRef, input } from '@angular/core';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { ValueDataComponentBase } from '@upupa/table';
import { InputDefaults } from '../defaults';

@Component({
    selector: 'form-autocomplete-text',
    templateUrl: './autocomplete-text.component.html',
    providers: [
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => AutoCompleteTextComponent),
            multi: true,
        },
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => AutoCompleteTextComponent),
            multi: true,
        },
    ],
})
export class AutoCompleteTextComponent extends ValueDataComponentBase<string> {
    inlineError = true;

    appearance = input(InputDefaults.appearance);
    floatLabel = input(InputDefaults.floatLabel);
    label = input('');
    panelClass = input('');
    placeholder = input('');
    hint = input('');
   

    _onlySelected = false;

    override ngOnInit() {
        // this._value ??= '';
        super.ngOnInit();
    }

    _valueChanged(value: any) {
        // this._value = value;
        // this.q = value as string;
        this.adapter().refresh();
        this._propagateChange();
    }

    optionSelected(option: MatAutocompleteSelectedEvent) {
        this._valueChanged(option.option.value);
    }
}
