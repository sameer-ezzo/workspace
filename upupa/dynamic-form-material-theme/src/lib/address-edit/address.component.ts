import { ChangeDetectionStrategy, Component, forwardRef, input } from "@angular/core";

import { FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { AddressComponent } from "@upupa/dynamic-form-native-theme";
import { MatFormFieldAppearance, MatFormFieldModule } from "@angular/material/form-field";
import { CommonModule } from "@angular/common";
import { MatInputModule } from "@angular/material/input";
import { MatSelectComponent } from "../select/select.component";

@Component({
    selector: "mat-form-address-input",
    templateUrl: "./address.component.html",
    styleUrls: ["./address.component.scss"],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MatAddressComponent),
            multi: true,
        },
    ],
    imports: [FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, CommonModule, MatSelectComponent],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MatAddressComponent extends AddressComponent {
    appearance = input<MatFormFieldAppearance>("outline");
}
