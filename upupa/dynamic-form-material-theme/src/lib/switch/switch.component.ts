import { ChangeDetectionStrategy, Component, effect, forwardRef, input, viewChild } from '@angular/core';
import { FormControlDirective, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatError, MatHint } from '@angular/material/form-field';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { ErrorsDirective, UtilsModule } from '@upupa/common';
import { ParagraphComponent, SwitchComponent } from '@upupa/dynamic-form-native-theme';

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
    imports: [MatCheckbox, UtilsModule, MatSlideToggle, MatError, MatHint, ParagraphComponent, ReactiveFormsModule,ErrorsDirective],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[class]': 'template()',
    },
})
export class MatSwitchComponent extends SwitchComponent {
    class = '';
    inputEl = viewChild.required<MatSlideToggle | MatCheckbox>('_inputElement');
    override template = input<'checkbox' | 'toggle'>('checkbox');

    constructor() {
        super();
        effect(
            () => {
                const ctrl = this.control();
                const disabled = this.disabled();
                if (!ctrl) return;
                if (disabled) ctrl.disable();
                else ctrl.enable();
            },
            { allowSignalWrites: true },
        );
    }
    changeValue() {
        const input = this.inputEl();
        input?.toggle();
    }
}
