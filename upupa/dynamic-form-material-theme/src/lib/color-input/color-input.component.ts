import { Component, forwardRef } from '@angular/core';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ColorInputComponent } from '@upupa/dynamic-form-native-theme';
// import { jscolor } from '@eastdesire/jscolor'

@Component({
    selector: 'mat-form-color-input',
    templateUrl: './color-input.component.html',
    styleUrls: ['./color-input.component.css'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MatColorInputComponent),
            multi: true,
        },
        { provide: NG_VALIDATORS, useExisting: forwardRef(() => MatColorInputComponent), multi: true }
    ]
})
export class MatColorInputComponent extends ColorInputComponent {
    // myPicker
    ngOnInit(): void {
        // this.myPicker = new jscolor('#colorInput1', { format: 'rgba' });

        // // let's additionally set an option
        // this.myPicker.option('previewSize', 80);

        // // we can also set multiple options at once
        // this.myPicker.option({
        //     'width': 101,
        //     'position': 'right',
        //     'backgroundColor': '#333',
        // });
    }
}