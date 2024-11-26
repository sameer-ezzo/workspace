import { Component, OnInit, DestroyRef, inject, WritableSignal } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { MatFormFieldAppearance } from "@angular/material/form-field";

import { MatDialogModule } from "@angular/material/dialog";
import { MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";
import { FormControl, ReactiveFormsModule, UntypedFormControl, Validators } from "@angular/forms";

import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { startWith } from "rxjs";
import { DialogWrapperComponent } from "../dialog-wrapper.component";
import { ActionDescriptor, ActionEvent } from "@upupa/common";
import { DialogPortal } from "../dialog.service";

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
                padding: 1rem;
            }
        `,
    ],
    standalone: true,
    imports: [MatDialogModule, MatInputModule, MatFormFieldModule, ReactiveFormsModule],
})
export class PromptComponent implements DialogPortal<PromptComponent>, OnInit {
    promptText = "Please enter value";
    promptTitle = "Prompt";
    promptNoButton = "No";
    promptYesButton = "Yes";
    placeholder = "";

    type = "text";
    required = false;
    dialogRef?: MatDialogRef<DialogWrapperComponent<PromptComponent>>;
    dialogActions?: WritableSignal<ActionDescriptor[]>;

    appearance: MatFormFieldAppearance = "outline";
    valueFormControl = new UntypedFormControl("", []);
    view: "input" | "textarea" = "input";
    private readonly destroyRef = inject(DestroyRef);
    private readonly data = inject(MAT_DIALOG_DATA, { optional: true });

    ngOnInit(): void {
        const data = this.data;
        if (data.appearance !== undefined) {
            this.appearance = data.appearance;
        }
        if (data.text !== undefined) {
            this.promptText = data.text;
        }
        if (data.placeholder !== undefined) {
            this.placeholder = data.placeholder;
        }
        this.view = data.view === "textarea" ? "textarea" : "input";
        this.required = data.required === true;

        const validators = this.required ? [Validators.required] : [];
        this.type = data.type ?? "text";
        if (data.type !== null) {
            if (this.type === "number") this.valueFormControl = new FormControl<number>(+(data.value || "0"), [...validators]);
            else if (this.type === "email") this.valueFormControl = new FormControl<string>(data.value || "", [...validators, Validators.email]);
            else this.valueFormControl = new FormControl<string>(data.value || "", [...validators]);
        }
        this.valueFormControl.updateValueAndValidity();

        this.valueFormControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef), startWith(null)).subscribe((v) => {
            this.dialogActions.set(
                this.dialogActions().map((a) => {
                    const action = { ...a, disabled: false };
                    if (a.type === "submit") action.disabled = this.valueFormControl.invalid;
                    return action;
                })
            );
        });
    }

    enterAction(e) {
        e.stopPropagation();
        e.preventDefault();
        const submitAction = this.dialogActions().find((a) => a.type === "submit");
        if (submitAction && e.key === "Enter") {
            this.onAction({ action: submitAction, data: undefined });
        }
    }
    async onAction(e: ActionEvent) {
        const dialogRef = e.context?.dialogRef ?? this.dialogRef;
        if (e.action.type === "submit") {
            if (this.valueFormControl.invalid) return;
            dialogRef.close(this.valueFormControl.value);
        } else dialogRef.close();
    }
}
