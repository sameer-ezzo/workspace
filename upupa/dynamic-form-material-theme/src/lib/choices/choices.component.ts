import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, forwardRef } from "@angular/core";
import { FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatIconModule } from "@angular/material/icon";
import { MatRadioModule } from "@angular/material/radio";
import { ChoicesComponent, ParagraphComponent } from "@upupa/dynamic-form-native-theme";
@Component({
    selector: "mat-form-choices-input",
    templateUrl: "./choices.component.html",
    styleUrls: ["./choices.component.scss"],
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MatChoicesComponent), multi: true }],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, CommonModule, MatCheckboxModule, MatRadioModule, MatIconModule, ParagraphComponent]
})
export class MatChoicesComponent extends ChoicesComponent {}
