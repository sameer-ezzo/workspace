import { Component, forwardRef } from "@angular/core";
import { NG_VALUE_ACCESSOR } from "@angular/forms";
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
})
export class MatTextAreaComponent extends TextAreaComponent {}
