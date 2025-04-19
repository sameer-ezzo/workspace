import { Component, forwardRef } from "@angular/core";
import { FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { ErrorsDirective } from "@upupa/common";
import { TextAreaComponent } from "@upupa/dynamic-form-native-theme";

@Component({
    selector: "mat-form-text-area-input",
    templateUrl: "./text-area.component.html",
    styleUrls: ["./text-area.component.css"],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MatTextAreaComponent),
            multi: true,
        },
    ],
    imports: [FormsModule, ReactiveFormsModule, ErrorsDirective, MatFormFieldModule, MatInputModule]
})
export class MatTextAreaComponent extends TextAreaComponent {}
