import { Component, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { InputBaseComponent } from '@upupa/common';
@Component({ standalone: true,
    selector: 'form-hidden-input',
    templateUrl: './hidden.component.html',
    styles: [
        `
            :host {
                display: none;
            }
        `,
    ],
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => HiddenComponent), multi: true }],
})
export class HiddenComponent extends InputBaseComponent {}
