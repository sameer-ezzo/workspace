// import { CommonModule } from "@angular/common";
// import { ChangeDetectionStrategy, Component, forwardRef, input } from "@angular/core";
// import { FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";

// import { MatFormFieldModule } from "@angular/material/form-field";
// import { MatInputModule } from "@angular/material/input";
// import { ErrorsDirective, InputBaseComponent } from "@upupa/common";
// import { MatTimepickerModule } from "@angular/material/timepicker";

// @Component({
//     standalone: true,
//     selector: "mat-form-time-input",
//     templateUrl: "./time-input.component.html",
//     providers: [
//         {
//             provide: NG_VALUE_ACCESSOR,
//             useExisting: forwardRef(() => MatTimeInputComponent),
//             multi: true,
//         },
//     ],
//     changeDetection: ChangeDetectionStrategy.OnPush,
//     imports: [FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, ErrorsDirective, CommonModule, MatTimepickerModule],
// })
// export class MatTimeInputComponent extends InputBaseComponent {
//     label = input("");
//     hint = input("");
//     readonly = input(false);
//     placeholder = input("");

// }
