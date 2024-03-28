import { TemplateRef, Inject, ViewChild, Optional, ComponentRef, SimpleChange, SimpleChanges, AfterViewInit, reflectComponentType, HostBinding, Input, ViewEncapsulation, HostListener, inject, DestroyRef, PLATFORM_ID } from "@angular/core";
import { MatDialogRef, MatDialogState, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { CdkPortalOutletAttachedRef, ComponentPortal } from "@angular/cdk/portal";
import { Component } from "@angular/core";
import { ActionEvent, ActionsDescriptor } from "../..";
import { fromEvent, Subject } from "rxjs";
import { debounceTime, startWith, takeUntil } from "rxjs/operators";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { isPlatformBrowser } from "@angular/common";


export interface UpupaDialogPortal {
    dialogRef?: MatDialogRef<UpupaDialogComponent>;
    onAction(e: ActionEvent, ref: MatDialogRef<UpupaDialogComponent>): Promise<any | ActionEvent>;
}

@Component({
    selector: "upupa-dialog",
    templateUrl: "./upupa-dialog.component.html",
    styleUrls: ["./upupa-dialog.component.scss"],
    encapsulation: ViewEncapsulation.None,
})
export class UpupaDialogComponent implements AfterViewInit {

    @HostBinding("class")
    private _class = "upupa-dialog-container";
    @Input()
    public get class() {
        return this._class;
    }
    public set class(value) {
        this._class = 'upupa-dialog-container ' + value.replace('upupa-dialog-container', '')
        this.dialogRef.addPanelClass("upupa-dialog-overlay");
    }

    @ViewChild("templatePortalContent")
    templatePortalContent: TemplateRef<unknown>;
    component;
    componentPortal: ComponentPortal<any>;
    actions: ActionsDescriptor = [];

    title: string;
    subTitle: string;
    showCloseBtn = true;
    private readonly destroyRef = inject(DestroyRef)
    @HostListener('keyup', ['$event'])
    keyup(e) {
        if (e.key !== 'Escape') return
        if (this.dialogData.canEscape !== true) return
        this.close();
    }

    constructor(
        @Optional() public dialogRef: MatDialogRef<UpupaDialogComponent>,
        @Optional() @Inject(MAT_DIALOG_DATA) public dialogData: any
    ) {
        this.actions = dialogData.actions ?? [];
        if (this.actions.length > 0) this._class += ' scroll-y'
        this.title = dialogData.title;
        this.subTitle = dialogData.subTitle;
        this.showCloseBtn = dialogData.hideCloseBtn !== true;
        this.componentPortal = new ComponentPortal(this.dialogData.component);
    }

    // inject platform id
    private readonly platformId = inject(PLATFORM_ID)
    ngAfterViewInit() {

        if (isPlatformBrowser(this.platformId))
            fromEvent(window, "resize")
                .pipe(startWith(0), debounceTime(50), takeUntilDestroyed(this.destroyRef))
                .subscribe((e) => {
                    this._setWidth();
                });

    }

    private _setWidth() {
        if (window.innerWidth < 790) this.dialogRef.updateSize("80%");
        else this.dialogRef.updateSize("100%");
    }
    onAttached(portalOutletRef: CdkPortalOutletAttachedRef) {

        portalOutletRef = portalOutletRef as ComponentRef<any>;
        this.component = portalOutletRef.instance;
        this.component.dialogRef = this.dialogRef;

        const meta = reflectComponentType(this.dialogData.component);
        const { inputs, outputs } = meta;

        if (this.dialogData?.inputs) {
            const inputsData = this.dialogData?.inputs;
            const inputsKeys = Object.getOwnPropertyNames(inputsData);
            if (inputsKeys.length > 0) {
                const changes = {} as SimpleChanges;
                for (const inputName of inputsKeys) {
                    const input = inputs.find((i) => i.propName === inputName || i.templateName === inputName);
                    if (input) {
                        changes[input.templateName] = {
                            currentValue: inputsData[inputName],
                            firstChange: true,
                            previousValue: undefined,
                        } as SimpleChange;
                        this.component[inputName] = inputsData[inputName];
                    } else
                        console.warn(
                            `The component ${meta.type.name} is missing an input named: ${inputName}`
                        );
                }
                if (this.component.ngOnChanges) this.component?.ngOnChanges(changes);
                this.component.changeDetectorRef?.detectChanges();
            }
        }

        if (this.dialogData?.outputs) {
            const outputsData = this.dialogData?.outputs;
            const outputsKeys = Object.getOwnPropertyNames(outputsData);
            if (outputsKeys.length > 0) {
                for (const outputName of outputsKeys) {
                    const output = outputs.find(
                        (i) => i.propName === outputName || i.templateName === outputName
                    );
                    if (output)
                        this.component[outputName]
                            .pipe(takeUntil(this.dialogRef.afterClosed()))
                            .subscribe((r) => {
                                this.dialogData?.outputs[outputName]?.(r, this.dialogRef);
                            });
                    else
                        console.warn(
                            `The component ${meta.type.name} is missing an output named: ${outputName}`
                        );
                }
            }

            this.component.action
                ?.pipe(takeUntil(this.dialogRef.afterClosed()))
                .subscribe(async (e) => {
                    await this.sendAction(e);
                });
        }
    }

    async sendAction(e: ActionEvent) {
        let res = e
        if (e.action.handler) res = await e.action.handler(e)
        else if (this.component.onAction) res = await this.component.onAction(e, this.dialogRef)


        if (this.dialogRef.getState() === MatDialogState.OPEN)
            if (e.action.meta?.closeDialog === true)
                this.dialogRef.close(res === e || typeof res === typeof e ? null : res)
            else console.warn(`Action ${e.action.action} has no handler.`);

    }

    close() {
        this.dialogRef.close();
    }
}
