import { ChangeDetectionStrategy, Component, forwardRef, ViewEncapsulation } from '@angular/core';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { InputComponent } from '@upupa/dynamic-form-native-theme';


@Component({
  selector: 'mat-form-input',
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MatInputComponent),
      multi: true,
    },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => MatInputComponent), multi: true }

  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MatInputComponent extends InputComponent { }




@Component({
  selector: 'mat-form-hidden-input',
  template: `
    <input #input type="hidden" [value]="value || ''" [required]="required">
  `,
  styleUrls: [],
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MatHiddenInputComponent),
      multi: true,
    },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => MatHiddenInputComponent), multi: true }

  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MatHiddenInputComponent extends InputComponent { }