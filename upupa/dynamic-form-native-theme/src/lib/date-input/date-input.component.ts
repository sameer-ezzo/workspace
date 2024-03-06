import { Component, Input, forwardRef } from '@angular/core';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { InputBaseComponent } from '@upupa/common';
import { InputDefaults } from '../defaults';


@Component({
  selector: 'data-input',
  templateUrl: './date-input.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateInputComponent),
      multi: true,
    },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => DateInputComponent), multi: true }
  ]
})
export class DateInputComponent extends InputBaseComponent {
  inlineError = true;


  @Input() appearance = InputDefaults.appearance;
  @Input() floatLabel = InputDefaults.floatLabel;
  @Input() placeholder: string;
  @Input() startView: 'multi-year' | 'year' | 'month' = 'month';
  @Input() touchUi = false;

  @Input() label: string;
  @Input() hint: string;
  @Input() readonly = false;
  @Input() errorMessages: { [errorCode: string]: string } = {};

  change(date: Date) {

    this.value = date
    this.control.markAsDirty()
  }
}


