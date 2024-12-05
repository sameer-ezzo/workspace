import { COMMA, ENTER } from "@angular/cdk/keycodes";
import { ChangeDetectionStrategy, Component, computed, forwardRef, inject, Injector, input, model, output, SimpleChanges } from "@angular/core";
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from "@angular/forms";
import { DataAdapter } from "@upupa/data";
import { FloatLabelType, MatFormFieldAppearance } from "@angular/material/form-field";
import { DataComponentBase } from "@upupa/table";

@Component({
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
    adding = output<any>({ alias: "add" });
    autoComplete = input(true);

    async add(value: string) {
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
