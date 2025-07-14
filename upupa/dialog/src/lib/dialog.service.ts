import { EnvironmentProviders, Injectable, Injector, Provider, Signal, ViewContainerRef, inject, makeEnvironmentProviders } from "@angular/core";
import { MatDialogConfig, MatDialog, MatDialogRef, MAT_DIALOG_DEFAULT_OPTIONS } from "@angular/material/dialog";
import { ActionDescriptor, ActionEvent, component, DynamicTemplate } from "@upupa/common";
import { DialogWrapperComponent } from "./dialog-wrapper.component";
import { DialogRef } from "./dialog-ref";
import { Router } from "@angular/router";

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
    // stack: DialogRef[] = [];
    readonly dialog: MatDialog = inject(MatDialog);
    readonly router = inject(Router);
    private readonly _injector = inject(Injector);
    private readonly viewContainerRef = inject(ViewContainerRef, { optional: true });
    constructor() {
        // What if the dialog is opened with the option closeOnNavigation = false?
        // this.router.events.subscribe((event) => {
        //     if (event instanceof NavigationEnd) {
        //         const stack = this.dialog.openDialogs.slice();
        //         for (const dialogRef of stack) {
        //             dialogRef.close();
        //         }
        //     }
        // });
    }

    open<TCom, TData = any, TResult = any>(template: DynamicTemplate<TCom>, options?: DialogConfig): DialogRef<TCom, TResult> {
        if (!template) throw new Error("template is not provided for dialog!");

        const _template = component(template);
        const injector = _template.injector ?? options?.injector ?? this._injector;
        _template.injector = undefined; // make the portal component use the DialogWrapperComponent injector that can provide DialogRef
        const matDialogRef = this.dialog.open<DialogWrapperComponent, TData, TResult>(DialogWrapperComponent, {
            ...options,
            injector,
            viewContainerRef: this.viewContainerRef, //https://github.com/angular/components/issues/25262#issuecomment-2574327824 AND https://github.com/angular/components/pull/30610

            //TODO check componentFactoryResolver: injector?.get(ComponentFactoryResolver), // workaround to make injector passed into attached component https://github.com/angular/components/issues/25262
            // viewContainerRef: injector?.get(ViewContainerRef),
        });

        matDialogRef.componentRef.setInput("template", _template);
        matDialogRef.componentRef.setInput(
            "header",
            (options?.header ?? []).map((t) =>
                component({
                    ...t,
                    injector: Injector.create({
                        providers: [{ provide: DialogRef, useValue: matDialogRef as DialogRef<TCom, TResult> }], // provide the DialogRef to the header components
                        parent: injector,
                        name: "DialogHeaderInjector",
                    }),
                } as DynamicTemplate<TCom>),
            ),
        );
        matDialogRef.componentRef.setInput(
            "footer",
            (options?.footer ?? []).map((t) =>
                component({
                    ...t,
                    injector: Injector.create({
                        providers: [{ provide: DialogRef, useValue: matDialogRef as DialogRef<TCom, TResult> }], // provide the DialogRef to the footer components
                        parent: injector,
                        name: "DialogFooterInjector",
                    }),
                } as DynamicTemplate<TCom>),
            ),
        );
        matDialogRef.componentRef.setInput("title", options?.title);
        matDialogRef.componentRef.setInput("hideCloseButton", options?.hideCloseButton);

        return matDialogRef as DialogRef<TCom, TResult>;
    }
}

export function provideGlobalDialogConfig(provider: Omit<Provider, "provide">): EnvironmentProviders {
    // i.e of a provider value {hasBackdrop: false}
    // this might be used to pass a global config to the dialog service (like width, height, etc)
    return makeEnvironmentProviders([
        {
            ...provider,
            provide: MAT_DIALOG_DEFAULT_OPTIONS,
        } as Provider,
    ]);
}
