import { CommonModule } from "@angular/common";
import { Component, computed, forwardRef, input, model, SimpleChanges } from "@angular/core";
import { FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { InputBaseComponent } from "@upupa/common";
import { InputDefaults } from "../../defaults";

// https://angular-slider.github.io/ngx-slider/demos
@Component({
    selector: "mat-form-numbers-range-input",
    templateUrl: "./numbers-range.component.html",
    styleUrls: ["./numbers-range.component.scss"],
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MatNumbersRangeComponent), multi: true }],
    imports: [CommonModule, MatFormFieldModule, MatInputModule, FormsModule, ReactiveFormsModule],
})
export class MatNumbersRangeComponent<T = number> extends InputBaseComponent {
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

    from = model<T | undefined>(undefined);
    to = model<T | undefined>(undefined);

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

    override async ngOnChanges(changes: SimpleChanges): Promise<void> {
        await super.ngOnChanges(changes);
        console.log("MatNumbersRangeComponent ngOnChanges", changes);
        
        if (changes["from"] || changes["to"]) {
            this.value.set({
                from: this.from(),
                to: this.to(),
            });
        }
        if (changes["control"] && this.control()) {
            this.value.set(this.control().value);
        }
        if (changes["value"]) {
            const value = this.value();
            if (value) {
                this.from.set(value.from);
                this.to.set(value.to);
            } else {
                this.from.set(undefined);
                this.to.set(undefined);
            }
        }
    }

    updateValue() {
        this.handleUserInput({
            from: this.from(),
            to: this.to(),
        });
    }

    // override propagateChange() {

    //   // if (this.from > this.to || nullEmptyCheck(this.from) || nullEmptyCheck(this.to)) this._value = undefined;
    //   // else this._value = { from: this.from, to: this.to }

    //   this._value = { from: this.from, to: this.to }

    //   const value = this._value;
    //   if (this._onChange) this._onChange(value); //ngModel/ngControl notify (value accessor)
    //   if (this.control) this.control.setValue(value); //control notify
    //   this.valueChange.emit(value); //value event binding notify
    //   this.value$.next(value); //template reference #component.value$ | async

    // };

    // override _updateViewModel() {
    //     if (this._value) {
    //         this.from = this._value.from;
    //         this.to = this._value.to;
    //     } else {
    //         this.from = undefined;
    //         this.to = undefined;
    //     }
    // }
}
