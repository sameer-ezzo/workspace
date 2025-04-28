import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, forwardRef, input } from "@angular/core";
import { FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatIconModule } from "@angular/material/icon";
import { MatRadioModule } from "@angular/material/radio";

import { DynamicComponent } from "@upupa/common";
import { MatSelectComponent } from "../select/select.component";
import { ParagraphComponent } from "../paragraph/paragraph.component";
@Component({
    selector: "mat-form-choices-input",
    templateUrl: "./choices.component.html",
    styleUrls: ["./choices.component.scss"],
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MatChoicesComponent), multi: true }],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, CommonModule, MatCheckboxModule, MatRadioModule, MatIconModule, ParagraphComponent],
})
export class MatChoicesComponent extends MatSelectComponent {
    direction = input<"horizontal" | "vertical">("horizontal");
    template = input<"normal" | "thumbs">("normal");
    thumbSize = input(75, {
        transform: (value) => Math.max(75, isNaN(+value) ? +value : 0),
    });

    //todo: transform these templates to dynamic components
    renderer = input<"markdown" | "html" | "none">("none");

    rendererTemplate = input<DynamicComponent>(null);
}
