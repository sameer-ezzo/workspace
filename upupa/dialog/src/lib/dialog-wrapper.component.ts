import { ViewEncapsulation, inject, input, computed, forwardRef } from "@angular/core";
import { MatDialogRef, MatDialogModule, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle } from "@angular/material/dialog";

import { Component } from "@angular/core";
import { DynamicComponent, PortalComponent } from "@upupa/common";
import { MatIcon, MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { DialogPortal } from "./dialog.service";
import { DialogRef } from "./dialog-ref";

@Component({
    selector: "dialog-wrapper",
    imports: [MatDialogModule, MatButtonModule, MatIcon, PortalComponent],
    templateUrl: "./dialog-wrapper.component.html",
    styleUrls: ["./dialog-wrapper.component.scss"],
    // encapsulation: ViewEncapsulation.None,
    host: {
        "[class]": "panelClass()",
    },
    providers: [
        {
            provide: DialogRef,
            useFactory: (self: DialogWrapperComponent) => self.dialogRef,
            deps: [forwardRef(() => DialogWrapperComponent)],
        },
    ],
})
export class DialogWrapperComponent<C = any> implements DialogPortal<C> {
    panelClass = input<string, string>("dialog-wrapper-container", {
        transform: (v: string) => `dialog-wrapper-container ${(v ?? "").replace("dialog-wrapper-container", "")}`,
    });

    title = input<string>("");
    hideCloseButton = input<boolean>(true);
    footer = input<DynamicComponent[]>([]);
    header = input<DynamicComponent[]>([]);
    template = input.required<DynamicComponent>();

    dialogRef = DialogRef.create(inject(MatDialogRef));

    onAttached(e: any) {
        this.dialogRef["_afterAttached"].next(e.componentRef);
    }

    constructor() {
        this.dialogRef.addPanelClass("dialog-wrapper-overlay");
    }

    close() {
        this.dialogRef.close();
    }
}
