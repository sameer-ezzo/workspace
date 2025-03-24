import { Component, OnInit, DestroyRef, inject, input, model } from "@angular/core";
import { MatFormFieldAppearance } from "@angular/material/form-field";

import { MatDialogModule } from "@angular/material/dialog";
import { MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";
import { FormControl, ReactiveFormsModule, UntypedFormControl, Validators } from "@angular/forms";

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
    standalone: true,
    imports: [MatDialogModule, MatBtnComponent, MatInputModule, MatFormFieldModule, ReactiveFormsModule],
})
export class PromptComponent implements OnInit {
    promptText = input("Please enter value");
    promptNoButton = input("No");
    promptYesButton = input("Yes");
    placeholder = input("");
    submitBtn = input<ActionDescriptor>({ name: "submit", text: "Submit", type: "submit", color: "primary", variant: "raised" });
    rows = input<number>(10);
    type = input("text");
    required = input(false);

    appearance = input<MatFormFieldAppearance>("outline");
    valueFormControl = new UntypedFormControl("", []);
    view = input<"input" | "textarea">("input");
    value = model<string | number>("");
    private readonly destroyRef = inject(DestroyRef);

    ngOnInit(): void {
        const validators = this.required ? [Validators.required] : [];

        if (this.type() === "number") this.valueFormControl = new FormControl<number>(+(this.value() ?? 0), [...validators]);
        else if (this.type() === "email") this.valueFormControl = new FormControl<string>(this.value() as string, [...validators, Validators.email]);
        else this.valueFormControl = new FormControl<string>(this.value() as string, [...validators]);

        this.valueFormControl.updateValueAndValidity();
    }

    enterAction(e) {
        e.stopPropagation();
        e.preventDefault();
        if (this.submitBtn() && e.key === "Enter") {
            this.submit();
        }
    }
    private readonly dialogRef = inject(DialogRef);
    async submit() {
        if (this.valueFormControl.invalid) return;
        this.dialogRef.close(this.valueFormControl.value);
    }
}
