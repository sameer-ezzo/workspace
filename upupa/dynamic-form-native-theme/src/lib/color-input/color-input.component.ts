import { Component, forwardRef, input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { InputBaseComponent } from '@upupa/common';
import { InputDefaults } from '../defaults';

@Component({ standalone: true,
    selector: 'form-color-input-field',
    templateUrl: './color-input.component.html',
    styleUrls: ['./color-input.component.css'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => ColorInputComponent),
            multi: true,
        },
    ],
})
export class ColorInputComponent extends InputBaseComponent {
    appearance = input(InputDefaults.appearance);
    floatLabel = input(InputDefaults.floatLabel);
    placeholder = input('');

    label = input('');
    hint = input('');
    readonly = input(false);

    inputChange(target: EventTarget, closable: { close: () => void } & any) {
        this.value.set((target as HTMLInputElement).value);
        closable.close();
    }
}
