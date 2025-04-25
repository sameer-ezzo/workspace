import { ChangeDetectionStrategy, Component, forwardRef, input, viewChild } from "@angular/core";
import { NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { MatCheckbox } from "@angular/material/checkbox";
import { MatError, MatHint } from "@angular/material/form-field";
import { MatSlideToggle } from "@angular/material/slide-toggle";
import { DynamicComponent, ErrorsDirective, UtilsModule } from "@upupa/common";
import { ParagraphComponent } from "../paragraph/paragraph.component";
import { MatInputComponent } from "../input/input.component";

@Component({
    selector: "mat-form-switch-input",
    templateUrl: "./switch.component.html",
    styleUrls: ["./switch.component.scss"],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MatSwitchComponent),
            multi: true,
        },
    ],
    imports: [MatCheckbox, UtilsModule, MatSlideToggle, MatError, MatHint, ParagraphComponent, ReactiveFormsModule, ErrorsDirective],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatSwitchComponent extends MatInputComponent<boolean> {
    template = input<"checkbox" | "toggle", "checkbox" | "toggle">("toggle", { transform: (v) => v ?? "toggle" });
    renderer = input<"markdown" | "html" | "none", "markdown" | "html" | "none">("none", { transform: (v) => v ?? "none" });
    rendererTemplate = input<DynamicComponent>(null);
    inputEl = viewChild.required<MatSlideToggle | MatCheckbox>("_inputElement");

    _handleUserInput(checked: boolean) {
        console.log(this.name(), checked);
        this.handleUserInput(checked);
    }

    toggle() {
        const input = this.inputEl();
        input?.toggle();
    }
}
