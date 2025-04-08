import { CommonModule } from "@angular/common";
import { Component, forwardRef } from "@angular/core";
import { FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { ErrorsDirective } from "@upupa/common";
import { ColorInputComponent } from "@upupa/dynamic-form-native-theme";
// import { jscolor } from '@eastdesire/jscolor'

@Component({
    selector: "mat-form-color-input",
    templateUrl: "./color-input.component.html",
    styleUrls: ["./color-input.component.css"],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MatColorInputComponent),
            multi: true,
        },
    ],
    imports: [FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, ErrorsDirective, CommonModule]
})
export class MatColorInputComponent extends ColorInputComponent {
    // myPicker
    ngOnInit(): void {
        // this.myPicker = new jscolor('#colorInput1', { format: 'rgba' });
        // // let's additionally set an option
        // this.myPicker.option('previewSize', 80);
        // // we can also set multiple options at once
        // this.myPicker.option({
        //     'width': 101,
        //     'position': 'right',
        //     'backgroundColor': '#333',
        // });
    }
}
