import { ChangeDetectionStrategy, Component, ViewEncapsulation, forwardRef, viewChild } from "@angular/core";
import { NG_VALIDATORS, NG_VALUE_ACCESSOR, Validator } from "@angular/forms";
import { MatSelect } from "@angular/material/select";
import { SelectComponent } from "@upupa/dynamic-form-native-theme";

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

    
    // override ngAfterViewInit() {
    //     super.ngAfterViewInit();
    //     this.selectInput().selectionChange.subscribe((e) => {
    //         this.value.set(this.control().value);
    //         this.control().updateValueAndValidity();
    //     });
    // }
}
