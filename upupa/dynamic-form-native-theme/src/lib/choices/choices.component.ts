import { Component, forwardRef, input } from "@angular/core";
import { NG_VALUE_ACCESSOR } from "@angular/forms";
import { SelectComponent } from "../select/select.component";
import { DynamicComponent } from "@upupa/common";
@Component({
    standalone: true,
    selector: "form-choices",
    templateUrl: "./choices.component.html",
    styleUrls: ["./choices.component.scss"],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => ChoicesComponent),
            multi: true,
        },
    ],
})
export class ChoicesComponent extends SelectComponent {
    direction = input<"horizontal" | "vertical">("horizontal");
    template = input<"normal" | "thumbs">("normal");
    thumbSize = input(75, {
        transform: (value) => Math.max(75, isNaN(+value) ? +value : 0),
    });
    renderer = input<"markdown" | "html" | "none">("none");
    rendererTemplate = input<DynamicComponent>(null);
}
