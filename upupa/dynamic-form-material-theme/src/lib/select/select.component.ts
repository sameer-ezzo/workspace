import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, ViewEncapsulation, forwardRef, viewChild } from "@angular/core";
import { FormsModule, NG_ASYNC_VALIDATORS, NG_VALIDATORS, NG_VALUE_ACCESSOR, ReactiveFormsModule, Validator } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSelect, MatSelectModule } from "@angular/material/select";
import { ErrorsDirective, FocusDirective } from "@upupa/common";
import { SelectComponent } from "@upupa/dynamic-form-native-theme";

@Component({
    imports: [
        MatSelectModule,
        FormsModule,
        ReactiveFormsModule,
        FocusDirective,
        MatIconModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        CommonModule,
        MatCheckboxModule,
        MatFormFieldModule,
        MatInputModule,
        ErrorsDirective,
    ],
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
            provide: NG_ASYNC_VALIDATORS,
            useExisting: forwardRef(() => MatSelectComponent),
            multi: true,
        },
    ]
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
