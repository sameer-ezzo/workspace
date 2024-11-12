import { Component, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
// import { Options } from "@angular-slider/ngx-slider";
import { SliderComponent } from '@upupa/dynamic-form-native-theme';

// https://angular-slider.github.io/ngx-slider/demos
@Component({
    selector: 'mat-form-slider-input',
    templateUrl: './slider.component.html',
    styleUrls: ['./slider.component.scss'],
    // encapsulation: ViewEncapsulation.None,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MatSliderComponent),
            multi: true,
        },
    ],
})
export class MatSliderComponent extends SliderComponent {}
