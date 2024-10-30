import { Component, forwardRef, input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { NumbersRangeComponent } from '../numbers-range/numbers-range.component';


@Component({
  selector: 'form-date-range-field',
  templateUrl: './date-range.component.html',
  styleUrls: ['./date-range.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateRangeComponent),
      multi: true,
    },
  ]
})
export class DateRangeComponent extends NumbersRangeComponent<Date> {
	readonly = input(false);

}


