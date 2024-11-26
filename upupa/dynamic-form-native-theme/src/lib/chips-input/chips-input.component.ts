import { COMMA, ENTER } from "@angular/cdk/keycodes";
import { Component, computed, forwardRef, inject, Injector, input, model, output, OutputEmitterRef, signal, SimpleChanges, viewChild } from "@angular/core";
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from "@angular/forms";
import { EventBus } from "@upupa/common";
import { createDataAdapter, DataAdapter, DataAdapterDescriptor, NormalizedItem } from "@upupa/data";
import { SelectComponent } from "../select/select.component";
import { FloatLabelType, MatFormFieldAppearance } from "@angular/material/form-field";

@Component({
    selector: "form-chips-input",
    templateUrl: "./chips-input.component.html",
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => ChipsComponent),
            multi: true,
        },
    ],
})
export class ChipsComponent<T = any> implements ControlValueAccessor {
    injector = inject(Injector);
    control = input(new FormControl());

    appearance = input<MatFormFieldAppearance>("outline");
    floatLabel = input<FloatLabelType>("auto");
    label = input("");
    name = input("");
    placeholder = input("");

    value = model<T[]>([]);
    text = model("");
    required = input(false);
    disabled = model(false);

    _value = computed(() => (this.value() ?? []).map((v) => this.adapter().normalize(v)));

    selectable = input(true);
    removable = input(true);
    separatorKeysCodes = input([ENTER, COMMA]);

    adapter = input.required<DataAdapter<T>>();

    canAdd = input(true);
    adding = output<any>({ alias: "add" });

    select(item) {
        this.value.update((v) => [...(v ?? []), item]);
    }

    remove(item): void {
        const keyProperty = this.adapter().keyProperty;
        const key = this.adapter().normalize(item).key;
        const index = this._value().findIndex((v) => v.key == key);
        this.value.update((v) => v.filter((x, i) => i != index));
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes?.["adapter"]) {
            this.adapter()?.refresh();
        }
    }

    async add(value: string) {
        if (!this.canAdd()) return;

        if (!(value || "").length) return;
        const adapter = this.adapter();

        const valueProperty = adapter.valueProperty;
        const chip = valueProperty
            ? Array.isArray(valueProperty)
                ? { [valueProperty[valueProperty.findIndex((x) => x != adapter.keyProperty)]]: value }
                : { [valueProperty]: value }
            : value;

        const item = await this.adapter().create(chip as any);
        const val = this.adapter().normalize(item as any);

        this.text.set("");
        this.select(val);
        this.adding.emit(val);
    }

    // >>>>> ControlValueAccessor ----------------------------------------
    _onChange: (value: T[]) => void;
    _onTouch: () => void;

    propagateChange() {
        this._onChange?.(this.value());
    }

    markAsTouched() {
        if (this._onTouch) this._onTouch();
    }

    writeValue(v: T[]): void {
        this.value.set(v);
    }

    registerOnChange(fn: (value: T[]) => void): void {
        this._onChange = fn;
    }
    registerOnTouched(fn: () => void): void {
        this._onTouch = fn;
    }
    setDisabledState?(isDisabled: boolean): void {
        this.disabled.set(isDisabled);
    }
}
