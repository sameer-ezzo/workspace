import { ChangeDetectionStrategy, Component, effect, forwardRef, input, viewChild } from "@angular/core";
import { NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { MatCheckbox } from "@angular/material/checkbox";
import { MatError, MatHint } from "@angular/material/form-field";
import { MatSlideToggle } from "@angular/material/slide-toggle";
import { ErrorsDirective, UtilsModule } from "@upupa/common";
import { ParagraphComponent, SwitchComponent } from "@upupa/dynamic-form-native-theme";

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
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MatSwitchComponent extends SwitchComponent {
    inputEl = viewChild.required<MatSlideToggle | MatCheckbox>("_inputElement");
    override template = input<"checkbox" | "toggle">("checkbox");

    _handleUserInput(checked: boolean) {
        console.log(this.name(), checked);
        this.handleUserInput(checked);
    }

    toggle() {
        const input = this.inputEl();
        input?.toggle();
    }
}
