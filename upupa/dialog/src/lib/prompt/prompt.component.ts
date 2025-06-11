import { Component, OnInit, DestroyRef, inject, input, model, output, SimpleChanges, OnChanges, runInInjectionContext, Injector } from "@angular/core";
import { MatFormFieldAppearance } from "@angular/material/form-field";

import { MatDialogModule } from "@angular/material/dialog";
import { MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";
import { FormControl, ReactiveFormsModule, UntypedFormControl, Validators, ValidatorFn } from "@angular/forms";

import { ActionDescriptor } from "@upupa/common";

import { DialogRef } from "../dialog-ref";
import { MatBtnComponent } from "@upupa/mat-btn";

@Component({
    selector: "prompt",
    templateUrl: "prompt.component.html",
    styles: [
        `
            :host {
                display: flex;
                flex-direction: column;
                width: 100%;
                box-sizing: border-box;

                mat-btn {
                    align-self: flex-end;
                }
            }
        `,
    ],
    imports: [MatDialogModule, MatInputModule, MatFormFieldModule, ReactiveFormsModule],
})
export class PromptComponent<T = string> implements OnChanges {
    submit = output<T | undefined>();

    promptText = input("Please enter value");
    // promptNoButton = input("No");
    // promptYesButton = input("Yes");
    placeholder = input("");
    // submitBtn = input<ActionDescriptor>({ name: "submit", text: "Submit", type: "submit", color: "primary", variant: "raised" });
    rows = input<number>(10);
    type = input("text");
    required = input(false);
    appearance = input<MatFormFieldAppearance>("outline");

    valueFormControl = new UntypedFormControl("", []);
    view = input<"input" | "textarea">("input");
    value = model<T>(undefined);

    ngOnChanges(changes: SimpleChanges): void {
        const validators: ValidatorFn[] = [];
        if (changes["required"]) {
            if (this.required()) {
                validators.push(Validators.required);
            }
        }
        if (changes["type"]) {
            if (this.type() === "number") {
                validators.push(Validators.pattern(/^-?\d*\.?\d*$/)); // Allow only numbers
            } else if (this.type() === "email") {
                validators.push(Validators.email); // Validate email format
            }
        }
        if (changes["value"]) {
            if (this.value() === undefined || this.value() === null) {
                this.valueFormControl.setValue("");
            } else {
                this.valueFormControl.setValue(this.value());
            }
        }
        this.valueFormControl.setValidators(validators);
        this.valueFormControl.updateValueAndValidity();

        this.valueFormControl.updateValueAndValidity();
    }

    private injector = inject(Injector);

    submitOnEnter(e?: Event | KeyboardEvent): void {
        this.valueFormControl.markAsTouched();
        e?.stopPropagation();
        e?.preventDefault();

        if (this.valueFormControl.invalid) return;
        runInInjectionContext(this.injector, () => {
            this.submit.emit(this.valueFormControl.value);
        });
    }
}
