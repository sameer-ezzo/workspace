import { Component, forwardRef, input } from "@angular/core";
import { NG_VALUE_ACCESSOR } from "@angular/forms";
import { InputBaseComponent } from "@upupa/common";
import { InputDefaults } from "../defaults";

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
export class DateInputComponent extends InputBaseComponent {
    inlineError = true;

    placeholder = input("");
    
    label = input("");
    hint = input("");
    readonly = input(false);

    min = input<Date | number | null>(null);
    max = input<Date | number | null>(null);
    
}
