/* eslint-disable @angular-eslint/component-selector */
import { ChangeDetectionStrategy, Component, Input, forwardRef } from '@angular/core';

import { NG_VALUE_ACCESSOR, NG_VALIDATORS } from '@angular/forms';
import { AddressComponent } from '@upupa/dynamic-form-native-theme';
import {MatFormFieldAppearance} from '@angular/material/form-field';


@Component({
    selector: 'mat-form-address-input',
    templateUrl: './address.component.html',
    styleUrls: ['./address.component.scss'],
    providers: [
        { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MatAddressComponent), multi: true },
        { provide: NG_VALIDATORS, useExisting: forwardRef(() => MatAddressComponent), multi: true }
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MatAddressComponent extends AddressComponent {
    @Input() appearance: MatFormFieldAppearance = 'outline';
}