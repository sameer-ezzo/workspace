import { ComponentFactoryResolver, Injectable, Signal, ViewContainerRef, inject } from "@angular/core";
import { MatDialog, MatDialogConfig, MatDialogRef } from "@angular/material/dialog";
import { ActionDescriptor, ActionEvent, component, DynamicTemplate } from "@upupa/common";
import { DialogWrapperComponent } from "./dialog-wrapper.component";
import { DialogRef } from "./dialog-ref";
import { DataAdapter } from "@upupa/data";
import { NavigationEnd, Router } from "@angular/router";

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
    stack: DialogRef[] = [];
    readonly dialog = inject(MatDialog);
    readonly router = inject(Router);

    constructor() {
        this.router.events.subscribe((event) => {
            if (event instanceof NavigationEnd) {
                const stack = this.stack.slice();
                for (const dialogRef of stack) {
                    dialogRef.close();
                }
            }
        });
    }

    open<TCom, TData = any, TResult = any>(template: DynamicTemplate<TCom>, options?: DialogConfig): DialogRef<TCom, TResult> {
        if (!template) throw new Error("template is not provided for dialog!");

        const _template = component(template);
        const injector = _template.injector ?? options?.injector;
        _template.injector = undefined; // make the portal component use the DialogWrapperComponent injector that can provide DialogRef
        const matDialogRef = this.dialog.open<DialogWrapperComponent, TData, TResult>(DialogWrapperComponent, {
            ...options,
            injector,
            componentFactoryResolver: injector?.get(ComponentFactoryResolver), // workaround to make injector passed into attached component https://github.com/angular/components/issues/25262
            //viewContainerRef:
        });
        matDialogRef.componentRef.setInput("template", _template);
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

        this.stack.push(matDialogRef as any);
        matDialogRef.afterClosed().subscribe(() => {
            this.stack = this.stack.filter((d) => d !== matDialogRef);
        });

        return matDialogRef as DialogRef<TCom, TResult>;
    }
}
