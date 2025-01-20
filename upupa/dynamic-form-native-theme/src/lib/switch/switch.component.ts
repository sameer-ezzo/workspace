import { Component, forwardRef, input } from "@angular/core";
import { FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { InputComponent } from "../input/input.component";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { DynamicComponent } from "@upupa/common";

@Component({
    standalone: true,
    selector: "form-switch",
    templateUrl: "./switch.component.html",
    styleUrls: ["./switch.component.css"],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => SwitchComponent),
            multi: true,
        },
    ],
    imports: [FormsModule, ReactiveFormsModule, MatSlideToggleModule, MatCheckboxModule],
})
export class SwitchComponent extends InputComponent {
    template = input<"checkbox" | "toggle">("toggle");
    renderer = input<"markdown" | "html" | "none">("none");
    rendererTemplate = input<DynamicComponent>(null);
}
