import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, forwardRef, viewChild } from "@angular/core";
import { AbstractControl, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator } from "@angular/forms";
import { MatSelect } from "@angular/material/select";
import { NormalizedItem } from "@upupa/data";

import { SelectComponent } from "@upupa/dynamic-form-native-theme";
import { isEmpty, set } from "lodash";

@Component({
    selector: "mat-form-select-input",
    templateUrl: "./select.component.html",
    styleUrls: ["./select.component.scss"],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MatSelectComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => MatSelectComponent),
            multi: true,
        },
    ],
})
export class MatSelectComponent<T = any> extends SelectComponent<T> implements Validator {
    override selectInput = viewChild<MatSelect>(MatSelect);
}
