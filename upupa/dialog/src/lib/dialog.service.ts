import { Injectable, TemplateRef, Inject, ElementRef, EventEmitter, SimpleChanges, SimpleChange, Signal, Type, input, inject, signal, Injector } from "@angular/core";
import { MatDialog, MatDialogConfig, MatDialogRef } from "@angular/material/dialog";
import { ComponentType } from "@angular/cdk/portal";
import { DOCUMENT } from "@angular/common";
import { firstValueFrom, Subject } from "rxjs";
import { ActionDescriptor, ActionEvent, component, DynamicComponent, DynamicTemplate } from "@upupa/common";
import { DialogWrapperComponent } from "./dialog-wrapper.component";
import { DialogRef } from "./dialog-ref";

export type UpupaDialogActionContext<C = any> = {
    host: DialogWrapperComponent<C>;
    component: C;
    dialogRef: MatDialogRef<DialogWrapperComponent<C>>;
} & Record<string, unknown>;

export interface DialogPortal<C = any> {
    dialogRef?: MatDialogRef<DialogWrapperComponent<C>>;
    dialogActions?: Signal<ActionDescriptor[]>;
    onAction?(e: ActionEvent<any, UpupaDialogActionContext<C>>): Promise<void>;
}

export type DialogConfig = MatDialogConfig & {
    title?: string;
    header?: DynamicTemplate[];
    footer?: DynamicTemplate[];

    hideCloseButton?: boolean;

    closingClasses?: string[];
    closeTimeout?: number;
    autoFullScreen?: boolean;
};

export const DEFAULT_DIALOG_CONFIG: DialogConfig = {
    width: "100%",
    maxWidth: "700px",
    maxHeight: "80vh",
    autoFullScreen: true,
    closeTimeout: 400,
    closingClasses: [],
    hideCloseButton: false,
};

@Injectable({ providedIn: "root" })
export class DialogService {
    private readonly dialog = inject(MatDialog);

    open<TCom, TData = any, TResult = any>(template: DynamicTemplate<TCom>, options?: DialogConfig): DialogRef<TCom, TResult> {
        if (!template) throw new Error("template is not provided for dialog!");

        const t = component(template);
        const matDialogRef = this.dialog.open<DialogWrapperComponent, TData, TResult>(DialogWrapperComponent, { ...options, injector: t.injector ?? options?.injector });
        t.injector = undefined; // make the portal component use the DialogWrapperComponent injector that can provide DialogRef
        matDialogRef.componentRef.setInput("template", t);
        matDialogRef.componentRef.setInput(
            "header",
            (options?.header ?? []).map((t) => component(t)),
        );
        matDialogRef.componentRef.setInput(
            "footer",
            (options?.footer ?? []).map((t) => component(t)),
        );
        matDialogRef.componentRef.setInput("title", options?.title);
        matDialogRef.componentRef.setInput("hideCloseButton", options?.hideCloseButton);

        return matDialogRef as DialogRef<TCom, TResult>;
    }

    // open<T, D = any, R = any>(componentOrTemplateRef: ComponentType<T> | TemplateRef<T>, config?: DialogServiceConfig<D>): MatDialogRef<T, R> {
    //     //CONFIG
    //     const _config: DialogServiceConfig<D> = Object.assign({}, this.defaultConfig, { direction: this.document.body.dir || "ltr" }, config);
    //     if (_config.autoFullScreen && this.document.body.clientWidth < 500) {
    //         _config.maxHeight = "100vh";
    //         _config.height = "100vh";
    //         _config.maxWidth = "100vw";
    //         _config.width = "100vw";
    //     }
    //     if (_config.closingClasses?.length) {
    //         _config.exitAnimationDuration = "0ms";
    //         _config.enterAnimationDuration = "0ms";
    //     }

    //     const disableClose = _config.disableClose;
    //     _config.disableClose = _config.closingClasses?.length > 0 && !disableClose;

    //     //OPEN
    //     const dialogRef = this.dialog.open(componentOrTemplateRef, _config);
    //     this.stack++;
    //     if (!disableClose && _config.closingClasses?.length) {
    //         const backdrop: HTMLDivElement = this._containerInstance(dialogRef)._overlayRef._backdropElement;
    //         backdrop.addEventListener("click", () => {
    //             this.close(dialogRef, _config);
    //         });
    //     }

    //     //INPUTS
    //     if (_config.inputs) {
    //         for (const inputName in _config.inputs) {
    //             dialogRef.componentRef.setInput(inputName, _config.inputs[inputName]);
    //         }
    //     }

    //     //OUTPUTS
    //     if (dialogRef.componentInstance["closed"]) {
    //         //TODO check outputs using component factory
    //         const output = dialogRef.componentInstance["closed"] as EventEmitter<R>;
    //         firstValueFrom(output).then((r) => {
    //             this.close(dialogRef, _config, r);
    //         });
    //     }

    //     if (_config.hideCloseButton !== true) {
    //         const _container: ElementRef<HTMLElement> = this._containerInstance(dialogRef)._elementRef;
    //         const container = _container.nativeElement;
    //         container.style.position = "relative";

    //         const b = this._styleCloseButton(this.document.createElement("button"));
    //         b.addEventListener(
    //             "click",
    //             () => {
    //                 this.close(dialogRef as any, _config);
    //             },
    //             false,
    //         );

    //         container.prepend(b);
    //     }

    //     this._dialogOpened$.next(true);

    //     return dialogRef;
    // }

    // private _containerInstance<T>(ref: MatDialogRef<T>): any {
    //     return ref["_containerInstance"];
    // }

    // private _styleCloseButton(b: HTMLButtonElement) {
    //     b.style.fontSize = "1.5em";
    //     b.style.cursor = "pointer";
    //     b.style.background = "none";
    //     b.style.border = "none";
    //     b.style.outline = "none";
    //     b.style.lineHeight = "1";

    //     b.style["z-index"] = "999";
    //     b.tabIndex = -1;

    //     //b.innerHTML = '&#x2716' //✖
    //     b.innerHTML = "&#10005"; //✕

    //     return b;
    // }
}
