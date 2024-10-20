import {
    Component,
    Input,
    forwardRef,
    SimpleChanges,
    input,
} from '@angular/core';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { EventBus } from '@upupa/common';
import { SelectComponent } from '../select/select.component';
@Component({
    selector: 'form-choices',
    templateUrl: './choices.component.html',
    styleUrls: ['./choices.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => ChoicesComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => ChoicesComponent),
            multi: true,
        },
    ],
})
export class ChoicesComponent extends SelectComponent {
    direction = input<'horizontal' | 'vertical'>('horizontal');
    template = input<'normal' | 'thumbs'>('normal');
    thumbSize = input(75, {
        transform: (value) => Math.max(75, isNaN(+value) ? +value : 0),
    });
    renderer = input<'markdown' | 'html' | 'none'>('none');
}
