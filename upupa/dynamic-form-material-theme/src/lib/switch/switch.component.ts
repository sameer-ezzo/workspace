import { ChangeDetectionStrategy, Component, forwardRef, input, viewChild } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { SwitchComponent } from '@upupa/dynamic-form-native-theme';

@Component({
    selector: 'mat-form-switch-input',
    templateUrl: './switch.component.html',
    styleUrls: ['./switch.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MatSwitchComponent),
            multi: true,
        },
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[class]': 'template()',
    },
})
export class MatSwitchComponent extends SwitchComponent {
    class = '';
    inputEl = viewChild.required<MatSlideToggle | MatCheckbox>('_inputElement');
    override template = input<'checkbox' | 'toggle'>('checkbox');

    changeValue() {
        const input = this.inputEl();
        input?.toggle();
    }
}
