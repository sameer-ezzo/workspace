import { Component, Input, forwardRef, input } from '@angular/core';
import {
    ControlValueAccessor,
    NG_VALIDATORS,
    NG_VALUE_ACCESSOR,
    UntypedFormControl,
} from '@angular/forms';
import { InputDefaults } from '../defaults';
import { InputBaseComponent } from '@upupa/common';

@Component({
    selector: 'form-text-area',
    templateUrl: './text-area.component.html',
    styleUrls: ['./text-area.component.css'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => TextAreaComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => TextAreaComponent),
            multi: true,
        },
    ],
})
export class TextAreaComponent extends InputBaseComponent<string> {
    inlineError = true;

    appearance = input(InputDefaults.appearance);
    floatLabel = input(InputDefaults.floatLabel);
    placeholder = input('');

    label = input('');
    hint = input('');
    readonly = input(false);
   

    cdkAutosizeMinRows = input(3, {
        transform: (v: number) => Math.max(1, v),
    });
    cdkAutosizeMaxRows = input(5, {
        transform: (v: number) => Math.max(1, v),
    });
    cdkTextareaAutosize = input<boolean>(true);
}
