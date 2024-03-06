import { ChangeDetectionStrategy, Component, forwardRef } from '@angular/core';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { AutoCompleteTextComponent } from '@upupa/dynamic-form-native-theme';

@Component({
  selector: 'mat-form-autocomplete-text-input',
  templateUrl: './autocomplete-text.component.html',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MatAutoCompleteTextComponent), multi: true },
  { provide: NG_VALIDATORS, useExisting: forwardRef(() => MatAutoCompleteTextComponent), multi: true }

  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MatAutoCompleteTextComponent extends AutoCompleteTextComponent { }

