import { ChangeDetectionStrategy, Component, ViewEncapsulation, forwardRef } from '@angular/core'
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms'

import { SelectComponent } from '@upupa/dynamic-form-native-theme'

@Component({
    selector: 'mat-form-select-input',
    templateUrl: './select.component.html',
    styleUrls: ['./select.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MatSelectComponent), multi: true },
        { provide: NG_VALIDATORS, useExisting: forwardRef(() => MatSelectComponent), multi: true }
    ]
})
export class MatSelectComponent<T = any> extends SelectComponent<T> {
}