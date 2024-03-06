import { ChangeDetectionStrategy, Component, forwardRef } from '@angular/core';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ChoicesComponent } from '@upupa/dynamic-form-native-theme';
@Component({
  selector: 'mat-form-choices-input',
  templateUrl: './choices.component.html',
  styleUrls: ['./choices.component.scss'],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MatChoicesComponent), multi: true, },
  { provide: NG_VALIDATORS, useExisting: forwardRef(() => MatChoicesComponent), multi: true }

  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MatChoicesComponent extends ChoicesComponent {
}