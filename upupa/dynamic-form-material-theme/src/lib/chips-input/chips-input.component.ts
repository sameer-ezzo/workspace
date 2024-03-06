import { ChangeDetectionStrategy, Component, forwardRef } from '@angular/core'
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms'
import { ChipsComponent } from '@upupa/dynamic-form-native-theme'

@Component({
    selector: 'mat-form-chips-input',
    templateUrl: './chips-input.component.html',
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MatChipsComponent), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => MatChipsComponent), multi: true }
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MatChipsComponent extends ChipsComponent {
}