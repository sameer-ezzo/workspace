import { ChangeDetectionStrategy, Component, forwardRef, input } from "@angular/core";
import { FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { AddressComponent } from "@upupa/dynamic-form-native-theme";
import { MatFormFieldAppearance, MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { CommonModule } from "@angular/common";
import { MatSelectComponent } from "../select/select.component";

// https://www.chromium.org/developers/design-documents/form-styles-that-chromium-understands/
// https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofilling-form-controls%3A-the-autocomplete-attribute

@Component({
    standalone: true,
    selector: "mat-form-address-input",
    templateUrl: "./address.component.html",
    styleUrls: ["./address.component.scss"],
    imports: [FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, CommonModule, MatSelectComponent],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MatAddressComponent),
            multi: true,
        },
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatAddressComponent extends AddressComponent {
    appearance = input<MatFormFieldAppearance>("outline");
}
