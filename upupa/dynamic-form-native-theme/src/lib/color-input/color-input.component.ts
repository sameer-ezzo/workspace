import { Component, Input, forwardRef } from '@angular/core';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { InputBaseComponent } from '@upupa/common';
import { InputDefaults } from '../defaults'

@Component({
    selector: 'form-color-input-field',
    templateUrl: './color-input.component.html',
    styleUrls: ['./color-input.component.css'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => ColorInputComponent),
            multi: true,
        },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => ColorInputComponent), multi: true }
    ]
})
export class ColorInputComponent extends InputBaseComponent {


    @Input() appearance = InputDefaults.appearance;
    @Input() floatLabel = InputDefaults.floatLabel;
    @Input() placeholder: string;


    @Input() label: string;
    @Input() hint: string;
    @Input() readonly = false;
    @Input() errorMessages: { [errorCode: string]: string } = {};


    inputChange(target: EventTarget, closable: { close: () => void } & any) {
        this.value = (target as HTMLInputElement).value
        closable.close()
    }
}