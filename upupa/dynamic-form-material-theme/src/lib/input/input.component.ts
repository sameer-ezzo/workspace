import { ChangeDetectionStrategy, Component, effect, ElementRef, forwardRef, inject, Injector, input, viewChild, ViewEncapsulation } from "@angular/core";
import { FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { FloatLabelType, MatFormFieldAppearance, MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { ErrorsDirective, InputBaseComponent } from "@upupa/common";
import { InputDefaults } from "../defaults";

@Component({
    selector: "mat-form-input",
    templateUrl: "./input.component.html",
    styleUrls: ["./input.component.scss"],
    encapsulation: ViewEncapsulation.None,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MatInputComponent),
            multi: true,
        },
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, ReactiveFormsModule, ErrorsDirective, MatFormFieldModule, MatInputModule, ErrorsDirective],
})
export class MatInputComponent<T = string> extends InputBaseComponent<T> {
    inlineError = true;

    appearance = input<MatFormFieldAppearance>(InputDefaults.appearance);
    floatLabel = input<FloatLabelType>(InputDefaults.floatLabel);
    placeholder = input("");

    type = input("text");
    label = input("");
    hint = input("");
    readonly = input(false);
    autocomplete = input("");

    private readonly _inputEl = viewChild<ElementRef>("_input");
    injector = inject(Injector);
    ngOnInit() {
        effect(
            () => {
                const attrs = this.attributes();
                const input = this._inputEl()?.nativeElement as HTMLInputElement;

                if (!input || attrs.length === 0) return;
                attrs.forEach((attr) => {
                    input.setAttribute(attr.attribute, attr.value);
                });
            },
            { injector: this.injector },
        );
    }

    // since this component is using T as value type (to allow inheriting from it and using other types)
    // we need to override the value setter to make sure it is of type string in this case (basic string input)
    updateValue(value: string) {
        this.value.set(value as T);
    }
}

@Component({
    selector: "hidden-input",
    template: ` <input type="hidden" [value]="value() ?? ''" /> `,
    encapsulation: ViewEncapsulation.None,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => HiddenInputComponent),
            multi: true,
        },
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HiddenInputComponent extends MatInputComponent {}
