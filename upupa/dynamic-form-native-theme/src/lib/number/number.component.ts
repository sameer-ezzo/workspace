import { Component, Input, forwardRef } from '@angular/core';
import { UntypedFormControl, NG_VALUE_ACCESSOR, NG_VALIDATORS } from '@angular/forms';
import { InputBaseComponent } from '@upupa/common';
import { InputDefaults } from '../defaults';



@Component({
  selector: 'form-number',
  templateUrl: './number.component.html',
  styleUrls: ['./number.component.scss'],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => NumberComponent), multi: true, },
  { provide: NG_VALIDATORS, useExisting: forwardRef(() => NumberComponent), multi: true }

  ]
})
export class NumberComponent extends InputBaseComponent {
  inlineError = true;

  @Input() appearance = InputDefaults.appearance;
  @Input() floatLabel = InputDefaults.floatLabel;
  @Input() placeholder: string;

  @Input() label: string;
  @Input() hint: string;
  @Input() readonly = false;
  @Input() errorMessages: { [errorCode: string]: string } = {};

  @Input() required: boolean;

  @Input() min: number = null;
  @Input() max: number = null;

}

