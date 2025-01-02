import { COMMA, ENTER } from "@angular/cdk/keycodes";
import { ChangeDetectionStrategy, Component, forwardRef, input, model, output } from "@angular/core";
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { FloatLabelType, MatFormFieldAppearance, MatFormFieldModule } from "@angular/material/form-field";

import { MatInputModule } from "@angular/material/input";
import { ErrorsDirective } from "@upupa/common";
import { DataComponentBase } from "@upupa/table";
import { MatChipsModule } from "@angular/material/chips";
import { CommonModule } from "@angular/common";
import { MatIconModule } from "@angular/material/icon";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { NormalizedItem } from "@upupa/data";

@Component({
    standalone: true,
    selector: "mat-form-chips-input",
    templateUrl: "./chips-input.component.html",
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MatChipsComponent),
            multi: true,
        },
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, ErrorsDirective, CommonModule, MatChipsModule, MatIconModule, MatAutocompleteModule],
})
export class MatChipsComponent<T = any> extends DataComponentBase implements ControlValueAccessor {
    appearance = input<MatFormFieldAppearance>("outline");
    floatLabel = input<FloatLabelType>("auto");
    label = input("");
    name = input("");
    placeholder = input("");

    text = model("");

    removable = input(true);
    separatorKeysCodes = input([ENTER, COMMA]);

    canAdd = input(true);
    adding = output<NormalizedItem<T>>({ alias: "add" });
    autoComplete = input(true);

    async add(value: any) {
        if (!value || !this.canAdd()) return;
        const adapter = this.adapter();

        const valueProperty = adapter.valueProperty;
        const chip = valueProperty
            ? Array.isArray(valueProperty)
                ? { [valueProperty[valueProperty.findIndex((x) => x != adapter.keyProperty)]]: value }
                : { [valueProperty]: value }
            : value;

        const item = await this.adapter().create(chip as any);
        const element = this.adapter().normalize(item as any);

        this.text.set("");
        this.select(element.value);
        this.adding.emit(element);
    }
}
