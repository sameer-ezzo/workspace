import { Component, Input, forwardRef } from '@angular/core';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DateRangeComponent } from '@upupa/dynamic-form-native-theme';

@Component({
  selector: 'mat-form-date-range-input',
  templateUrl: './date-range.component.html',
  styleUrls: ['./date-range.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MatDateRangeComponent),
      multi: true,
    },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => MatDateRangeComponent), multi: true }
  ]
})
export class MatDateRangeComponent extends DateRangeComponent {}