import { Component, forwardRef, input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { InputBaseComponent } from '@upupa/common';
import { InputDefaults } from '../defaults';

@Component({ standalone: true,
    selector: 'data-input',
    templateUrl: './date-input.component.html',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => DateInputComponent),
            multi: true,
        },
    ],
})
export class DateInputComponent extends InputBaseComponent {
    inlineError = true;

    appearance = input(InputDefaults.appearance);
    floatLabel = input(InputDefaults.floatLabel);
    placeholder = input('');
    startView = input<'multi-year' | 'year' | 'month'>('month');
    touchUi = input(false);
    label = input('');
    hint = input('');
    readonly = input(false);
}
