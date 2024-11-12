import { Component, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

import { PasswordInputComponent } from '@upupa/dynamic-form-native-theme'

@Component({
    selector: 'mat-form-password-input',
    templateUrl: './password.component.html',
    styleUrls: ['./password.component.scss'],
    providers: [
        { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PasswordInputComponent), multi: true },
    ]
})
export class MatPasswordInputComponent extends PasswordInputComponent { }
