import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, forwardRef } from "@angular/core";
import { FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { ErrorsDirective } from "@upupa/common";
import { AutoCompleteTextComponent } from "@upupa/dynamic-form-native-theme";

@Component({
    selector: "mat-form-autocomplete-text-input",
    templateUrl: "./autocomplete-text.component.html",
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MatAutoCompleteTextComponent), multi: true }],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, ErrorsDirective, CommonModule, MatAutocompleteModule]
})
export class MatAutoCompleteTextComponent extends AutoCompleteTextComponent {}
