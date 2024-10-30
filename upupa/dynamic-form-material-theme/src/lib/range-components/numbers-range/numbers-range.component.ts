import { Component, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { NumbersRangeComponent } from '@upupa/dynamic-form-native-theme';

// https://angular-slider.github.io/ngx-slider/demos
@Component({
    selector: 'mat-form-numbers-range-input',
    templateUrl: './numbers-range.component.html',
    styleUrls: ['./numbers-range.component.scss'],
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MatNumbersRangeComponent), multi: true }],
})
export class MatNumbersRangeComponent<T = number> extends NumbersRangeComponent<T> {}
