
import { Component, computed, forwardRef, input } from "@angular/core";
import { FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { InputDefaults } from "../../defaults";
import { RangeInputBaseComponent } from "../rang-input-base.component";

// https://angular-slider.github.io/ngx-slider/demos
@Component({
    selector: "mat-form-numbers-range-input",
    templateUrl: "./numbers-range.component.html",
    styleUrls: ["./numbers-range.component.scss"],
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MatNumbersRangeComponent), multi: true }],
    imports: [MatFormFieldModule, MatInputModule, FormsModule, ReactiveFormsModule],
})
export class MatNumbersRangeComponent<T = number> extends RangeInputBaseComponent<T> {
    appearance = input(InputDefaults.appearance);
    floatLabel = input(InputDefaults.floatLabel);
    label = input("");
    placeholder = input("");
    hint = input("");

    floor = input(0);
    ceiling = input(100);
    step = input(1);

    pushRange = input(false);
    showSelectionBar = input(true);

    //@Input() selectionBarGradient: { from: string, to: string };
    //@Input() getSelectionBarColor: (value: number) => string;
    //@Input() getPointerColor: (value: number) => string;

    thumbSize = input(75, {
        transform: (v: number) => Math.max(5, v),
    });

    _items = [];
    _options: {
        floor: number;
        ceil: number;
        step: number;
        minLimit: any;
        maxLimit: any;
    };

    options = computed(() => {
        return {
            floor: this.floor(),
            ceil: this.ceiling(),
            step: this.step(),
            minLimit: this.floor(),
            maxLimit: this.ceiling(),
        };
    });

    items = computed(() => {
        return new Array(this.ceiling() - this.floor()).fill(0).map((_, i) => i);
    });
}
