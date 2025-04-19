import { Component, ChangeDetectionStrategy, input, inject } from "@angular/core";
import { MatDialogModule, MatDialogRef } from "@angular/material/dialog";

import { ActionDescriptor } from "@upupa/common";
import { MatBtnComponent } from "@upupa/mat-btn";

@Component({
    selector: "confirm",
    imports: [MatDialogModule, MatBtnComponent],
    templateUrl: "confirm.component.html",
    styleUrls: ["confirm.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfirmComponent {
    dialogRef = inject(MatDialogRef);

    confirmTitle = input("Confirm");
    confirmText = input("Do you confirm?");
    discardButton = input<ActionDescriptor, Partial<ActionDescriptor>>(undefined, {
        transform: (x) => ({
            name: "discard",
            color: x.color,
            variant: "button",
            text: x.text ?? "Discard",
        }),
    });
    confirmButton = input<ActionDescriptor, Partial<ActionDescriptor>>(undefined, {
        transform: (x) => ({
            name: "confirm",
            color: x.color || "primary",
            variant: "raised",
            text: x.text ?? "Confirm",
        }),
    });
    img = input<string | undefined>();
}
