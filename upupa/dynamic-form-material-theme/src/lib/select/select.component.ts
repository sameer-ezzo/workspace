import { ChangeDetectionStrategy, Component, ViewEncapsulation, forwardRef, viewChild } from "@angular/core";
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
    selectInput = viewChild<MatSelect>(MatSelect);

    _flag = false;
    validate(control: AbstractControl): ValidationErrors | null {
        if (this._flag && control.value && this.noOption() && this.dataLoaded()) {
            control.markAsTouched();
            const value = control.value._id ?? control.value;
            return {
                select: {
                    message: `No option found matching value "${value}"`,
                },
            };
        }
        return null;
    }

    ngAfterViewInit() {
        this.selectInput().selectionChange.subscribe(() => {
            this.control().updateValueAndValidity();
        });

        setTimeout(() => {
            this._flag = true;
            this.control().updateValueAndValidity();
        }, 200);
    }

    noOption() {
        const select = this.selectInput();
        return Array.isArray(select.selected) ? !select.selected.length : !select.selected;
    }

    async onClicked(e) {
        if (this.isPanelOpened) return;
        if (open && !this.adapter().dataSource.allDataLoaded && this.lazyLoadData()) {
            e.stopPropagation();
            await this.loadData();
        }
    }
}
