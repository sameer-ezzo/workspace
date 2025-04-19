import { Component, forwardRef, input } from "@angular/core";
import { NG_VALUE_ACCESSOR } from "@angular/forms";
import { InputBaseComponent } from "@upupa/common";

@Component({
    standalone: true,
    selector: "data-input",
    templateUrl: "./date-input.component.html",
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => DateInputComponent),
            multi: true,
        },
    ],
})
export class DateInputComponent extends InputBaseComponent<Date> {
    inlineError = true;

    placeholder = input("");

    label = input("");
    hint = input("");
    readonly = input(false);

    now = new Date();

    min = input<Date | number | null>(null);
    max = input<Date | number | null>(null);

    setDate(value: string) {
        const date = new Date(value);
        this.value.set(date);
        this.control()?.setValue(this.value());
    }
}
