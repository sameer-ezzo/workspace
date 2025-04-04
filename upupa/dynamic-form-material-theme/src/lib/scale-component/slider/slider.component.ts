import { CommonModule } from "@angular/common";
import { Component, forwardRef } from "@angular/core";
import { FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
// import { Options } from "@angular-slider/ngx-slider";
import { SliderComponent } from "@upupa/dynamic-form-native-theme";

// https://angular-slider.github.io/ngx-slider/demos
@Component({
    selector: "mat-form-slider-input",
    templateUrl: "./slider.component.html",
    styleUrls: ["./slider.component.scss"],
    // encapsulation: ViewEncapsulation.None,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MatSliderComponent),
            multi: true,
        },
    ],
    imports: [CommonModule, MatFormFieldModule, MatInputModule, FormsModule, ReactiveFormsModule, MatIconModule, MatButtonModule]
})
export class MatSliderComponent extends SliderComponent {}
