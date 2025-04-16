import { CommonModule } from "@angular/common";
import { Component, forwardRef } from "@angular/core";
import { FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { ErrorsDirective } from "@upupa/common";
import { PhoneInputComponent } from "@upupa/dynamic-form-native-theme";

@Component({
    selector: "mat-form-phone-input",
    templateUrl: "./phone.component.html",
    styleUrls: ["./phone.component.scss"],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MatPhoneInputComponent),
            multi: true,
        },
    ],
    imports: [FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, ErrorsDirective, CommonModule]
})
export class MatPhoneInputComponent extends PhoneInputComponent {

}
