import {
    Component,
    DestroyRef,
    Input,
    forwardRef,
    inject,
    input,
} from '@angular/core';
import {
    UntypedFormControl,
    NG_VALUE_ACCESSOR,
    NG_VALIDATORS,
} from '@angular/forms';
import { InputBaseComponent } from '@upupa/common';
import { InputDefaults } from '../defaults';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
    MatFormFieldAppearance,
    FloatLabelType,
} from '@angular/material/form-field';

@Component({
    selector: 'form-number',
    templateUrl: './number.component.html',
    styleUrls: ['./number.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => NumberComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => NumberComponent),
            multi: true,
        },
    ],
})
export class NumberComponent extends InputBaseComponent {
    inlineError = true;

    appearance = input<MatFormFieldAppearance>(InputDefaults.appearance);
    floatLabel = input<FloatLabelType>(InputDefaults.floatLabel);
    placeholder = input('');

    label = input('');
    hint = input('');
    readonly = input(false);

    min = input<number>(Number.MIN_VALUE);
    max = input<number>(Number.MAX_VALUE);

    // add input to tell the component about the number type (integer, float, double, etc)
    numberType = input<'integer' | 'float' | 'double'>('float');

    private readonly fixNumberType = (value: any) => {
        if (value === null || value === undefined) return;
        if (this.numberType() === 'integer')
            this.value.set(parseInt(value, 10));
        else this.value.set(parseFloat(value));
    };
}
