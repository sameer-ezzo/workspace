import { ChangeDetectionStrategy, Component, HostBinding, Input, forwardRef } from '@angular/core';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SwitchComponent } from '@upupa/dynamic-form-native-theme';


@Component({
  selector: 'mat-form-switch-input',
  templateUrl: './switch.component.html',
  styleUrls: ['./switch.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MatSwitchComponent),
      multi: true,
    },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => MatSwitchComponent), multi: true }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MatSwitchComponent extends SwitchComponent {
  class = '';

  @Input()
  @HostBinding('class')
  override template: 'checkbox' | 'toggle' = 'checkbox';
}