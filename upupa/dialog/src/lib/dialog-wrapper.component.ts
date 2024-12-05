import { AfterViewInit, ViewEncapsulation, HostListener, inject, DestroyRef, PLATFORM_ID, signal, input, computed, ComponentRef, output } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from "@angular/material/dialog";

import { Component } from "@angular/core";
import { fromEvent, Subject } from "rxjs";
import { debounceTime, startWith } from "rxjs/operators";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { isPlatformBrowser } from "@angular/common";
import { ActionDescriptor, ActionEvent, DynamicComponent, PortalComponent } from "@upupa/common";
import { MatBtnComponent } from "@upupa/mat-btn";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { DialogRefD, UpupaDialogActionContext, DialogPortal } from "./dialog.service";

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
    // providers: [{ provide: MatDialogRef, useFactory: (upupa: UpupaDialogComponent) => upupa.dialogRef, deps: [UpupaDialogComponent] }],
})
export class DialogWrapperComponent<C = any> implements DialogPortal<C>, AfterViewInit {
    hostClass = computed(() => [this.panelClass(), this.dialogActions().length > 0 ? "y-scroll" : ""].join(" "));
    panelClass = input<string, string>("dialog-wrapper-container", {
        transform: (v: string) => `dialog-wrapper-container ${(v ?? "").replace("dialog-wrapper-container", "")}`,
    });

    dialogActions = signal([]);
    title = signal<string>("");
    subTitle = signal<string>("");
    hideCloseButton = signal<boolean>(true);
    actionClick = output<ActionEvent<any>>();

    private readonly destroyRef = inject(DestroyRef);
    private _afterAttached$ = new Subject<ComponentRef<any>>();

    @HostListener("keyup", ["$event"])
    keyup(e) {
        if (e.key === "Escape" && this.dialogData.canEscape === true) {
            e.preventDefault();
            e.stopPropagation();
            this.close();
        }
    }

    onAttached(e: any) {
        this._afterAttached$.next(e.componentRef);
    }

    public dialogData = inject(MAT_DIALOG_DATA) as DialogRefD;
    dialogRef: MatDialogRef<DialogWrapperComponent<C>> = inject(MatDialogRef);
    template = signal<DynamicComponent>(null);
    constructor() {
        const data = this.dialogData as DialogRefD["data"];
        this.dialogRef.addPanelClass("dialog-wrapper-overlay");
        this.template.set(data.component);
        this.dialogActions.set((data.dialogActions || []) as ActionDescriptor[]);
        this.title.set(data.title || "");
        this.subTitle.set(data.subTitle);
        this.hideCloseButton.set(data.hideCloseButton === true);

        this.dialogRef["afterAttached"] = () => this._afterAttached$.asObservable();
        this.dialogRef.componentInstance;
        // this.dialogRef['instanceRef'] = signal<any>(null);
    }

    // inject platform id
    private readonly platformId = inject(PLATFORM_ID);
    ngAfterViewInit() {
        this.registerWidthWatcher();
    }

    private registerWidthWatcher() {
        if (isPlatformBrowser(this.platformId))
            fromEvent(window, "resize")
                .pipe(startWith(0), debounceTime(50), takeUntilDestroyed(this.destroyRef))
                .subscribe((e) => {
                    if (window.innerWidth < 790) this.dialogRef.updateSize("80%");
                    else this.dialogRef.updateSize("100%");
                });
    }

    async onAction(e: ActionEvent<any, UpupaDialogActionContext<C>>) {
        e.context = {
            ...e.context,
            dialogRef: this.dialogRef,
            // component: this.component,
            host: this,
        };
        this.actionClick.emit(e);
    }

    close() {
        this.dialogRef?.close();
    }
}
