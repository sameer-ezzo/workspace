import { Component, Input, forwardRef, ViewEncapsulation, SimpleChanges } from '@angular/core';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { InputBaseComponent } from '@upupa/common';
import { InputDefaults } from '../defaults';


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
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => InputComponent), multi: true }
    ]
})
export class InputComponent extends InputBaseComponent {
    inlineError = true;

    @Input() appearance = InputDefaults.appearance;
    @Input() floatLabel = InputDefaults.floatLabel;
    @Input() placeholder: string;

    @Input() type = 'text';
    @Input() label: string;
    @Input() hint: string;
    private _readonly = false;
    @Input()
    public get readonly() {
        return this._readonly;
    }
    public set readonly(value) {
        this._readonly = value;
        this.setDisabledState(value === true)
    }
    @Input() errorMessages: { [errorCode: string]: string } = {};

    override ngOnChanges(changes: SimpleChanges): void {
        super.ngOnChanges(changes)
        this.setDisabledState(this.readonly === true)
    }
}


