import { AfterViewInit, ViewEncapsulation, HostListener, inject, DestroyRef, PLATFORM_ID, signal, input, computed, ComponentRef, output, forwardRef } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from "@angular/material/dialog";

import { Component } from "@angular/core";
import { fromEvent, ReplaySubject, Subject } from "rxjs";
import { debounceTime, startWith } from "rxjs/operators";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { isPlatformBrowser } from "@angular/common";
import { ActionDescriptor, ActionEvent, DynamicComponent, PortalComponent } from "@upupa/common";
import { MatBtnComponent } from "@upupa/mat-btn";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { UpupaDialogActionContext, DialogPortal } from "./dialog.service";
import { DialogRef } from "./dialog-ref";

@Component({
    selector: "dialog-wrapper",
    standalone: true,
    imports: [MatDialogModule, MatBtnComponent, MatButtonModule, MatIconModule, PortalComponent],
    templateUrl: "./dialog-wrapper.component.html",
    styleUrls: ["./dialog-wrapper.component.scss"],
    encapsulation: ViewEncapsulation.None,
    host: {
        "[class]": "hostClass()",
    },
    providers: [
        {
            provide: DialogRef,
            useFactory: (self: DialogWrapperComponent) => self.dialogRef,
            deps: [forwardRef(() => DialogWrapperComponent)],
        },
    ],
})
export class DialogWrapperComponent<C = any> implements DialogPortal<C>, AfterViewInit {
    hostClass = computed(() => [this.panelClass(), this.footer().length > 0 ? "y-scroll" : ""].join(" "));
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

    private readonly platformId = inject(PLATFORM_ID);
    ngAfterViewInit() {
        this.registerWidthWatcher();
    }

    private readonly destroyRef = inject(DestroyRef);
    private registerWidthWatcher() {
        if (isPlatformBrowser(this.platformId))
            fromEvent(window, "resize")
                .pipe(startWith(0), debounceTime(50), takeUntilDestroyed(this.destroyRef))
                .subscribe((e) => {
                    if (window.innerWidth < 790) this.dialogRef.updateSize("80%");
                    else this.dialogRef.updateSize("100%");
                });
    }

    close() {
        this.dialogRef.close();
    }
}
