import { Component, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { PortalComponent } from '@upupa/common';
import { ArrayInputComponent } from '@upupa/dynamic-form-native-theme';
import { DataTableModule } from '@upupa/table';

@Component({
    selector: 'mat-form-array-input',
    templateUrl: './array-input.component.html',
    standalone: true,
    imports: [DataTableModule, PortalComponent, MatFormFieldModule],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MatArrayInputComponent),
            multi: true,
        },
    ],
})
export class MatArrayInputComponent<T = any> extends ArrayInputComponent<T> {}
