import { Component, forwardRef } from '@angular/core'
import { NG_VALUE_ACCESSOR, NG_VALIDATORS } from '@angular/forms'
import { PhoneInputComponent } from '@upupa/dynamic-form-native-theme'


@Component({
    selector: 'mat-form-phone-input',
    templateUrl: './phone.component.html',
    styleUrls: ['./phone.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MatPhoneInputComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => MatPhoneInputComponent),
            multi: true,
        }
    ]
})
export class MatPhoneInputComponent extends PhoneInputComponent {
}