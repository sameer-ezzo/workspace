import { ChangeDetectionStrategy, Component, Directive, forwardRef, input, Pipe, TemplateRef, ViewContainerRef, ViewEncapsulation } from '@angular/core';
import { FormControl, NG_VALUE_ACCESSOR, ValidationErrors } from '@angular/forms';
import { InputComponent } from '@upupa/dynamic-form-native-theme';

@Component({
    selector: 'mat-form-input',
    templateUrl: './input.component.html',
    styleUrls: ['./input.component.scss'],
    encapsulation: ViewEncapsulation.None,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MatInputComponent),
            multi: true,
        },
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatInputComponent extends InputComponent {}

@Component({
    selector: 'hidden-input',
    template: ` <input type="hidden" [value]="value() ?? ''" /> `,
    encapsulation: ViewEncapsulation.None,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => HiddenInputComponent),
            multi: true,
        },
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HiddenInputComponent extends InputComponent {}
