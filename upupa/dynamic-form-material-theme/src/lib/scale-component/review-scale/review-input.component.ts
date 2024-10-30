import { Component, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { ReviewScaleComponent } from '@upupa/dynamic-form-native-theme';

@Component({
    selector: 'mat-form-review-input',
    templateUrl: './review-input.component.html',
    styleUrls: ['./review-input.component.css'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MatReviewScaleComponent),
            multi: true,
        },
    ],
})
export class MatReviewScaleComponent extends ReviewScaleComponent {}
