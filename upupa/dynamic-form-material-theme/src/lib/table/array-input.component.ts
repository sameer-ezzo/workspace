import { Component, forwardRef } from '@angular/core';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ArrayInputComponent } from '@upupa/dynamic-form-native-theme';

@Component({
    selector: 'mat-form-array-input',
    templateUrl: './array-input.component.html',
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MatArrayInputComponent), multi: true, },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => MatArrayInputComponent), multi: true }

    ]
})
export class MatArrayInputComponent<T = any> extends ArrayInputComponent<T> {
}