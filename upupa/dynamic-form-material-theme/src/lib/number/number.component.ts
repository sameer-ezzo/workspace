import { Component, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { NumberComponent } from '@upupa/dynamic-form-native-theme';

@Component({
    selector: 'mat-form-number-input',
    templateUrl: './number.component.html',
    styleUrls: ['./number.component.scss'],
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MatNumberComponent), multi: true }],
})
export class MatNumberComponent extends NumberComponent {}
