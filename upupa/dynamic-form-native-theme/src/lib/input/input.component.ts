import {
    Component,
    Input,
    forwardRef,
    ViewEncapsulation,
    SimpleChanges,
    input,
} from '@angular/core';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { InputBaseComponent } from '@upupa/common';
import { InputDefaults } from '../defaults';
import {
    FloatLabelType,
    MatFormFieldAppearance,
} from '@angular/material/form-field';

@Component({
    selector: 'form-input-field',
    templateUrl: './input.component.html',
    styleUrls: ['./input.component.css'],
    encapsulation: ViewEncapsulation.None,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => InputComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => InputComponent),
            multi: true,
        },
    ],
})
export class InputComponent extends InputBaseComponent {
    inlineError = true;

    appearance = input<MatFormFieldAppearance>(InputDefaults.appearance);
    floatLabel = input<FloatLabelType>(InputDefaults.floatLabel);
    placeholder = input('');

    type = input('text');
    label = input('');
    hint = input('');
    readonly = input(false);
    errorMessages = input<{ [errorCode: string]: string }>({});

    override ngOnChanges(changes: SimpleChanges): void {
        super.ngOnChanges(changes);
        this.setDisabledState(this.readonly() === true);
    }
}
