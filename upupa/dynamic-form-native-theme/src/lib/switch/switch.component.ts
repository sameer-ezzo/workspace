import { Component, Input, forwardRef, input } from '@angular/core';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { InputComponent } from '../input/input.component';

@Component({
    selector: 'form-switch',
    templateUrl: './switch.component.html',
    styleUrls: ['./switch.component.css'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => SwitchComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => SwitchComponent),
            multi: true,
        },
    ],
})
export class SwitchComponent extends InputComponent {
    template = input<'checkbox' | 'toggle'>('toggle');
    renderer = input<'markdown' | 'html' | 'none'>('none');
}
