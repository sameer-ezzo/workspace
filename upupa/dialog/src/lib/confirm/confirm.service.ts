import { inject, Injectable, InjectionToken } from "@angular/core";
import { MatDialogConfig } from "@angular/material/dialog";
import { firstValueFrom } from "rxjs";
import { DialogService, DialogConfig } from "../dialog.service";
import { ConfirmComponent } from "./confirm.component";
import { ActionDescriptor, ComponentInputs, DynamicComponent } from "@upupa/common";
import { MatBtnComponent } from "@upupa/mat-btn";
import { DialogRef } from "../dialog-ref";
import { text } from "stream/consumers";

export class ConfirmOptions extends MatDialogConfig<any> {
    title?: string;
    img?: string;
    confirmText?: string;
    no?: string;
    yes?: string;
}

const configFactory = (): MatDialogConfig => {
    return {
        width: "100%",
        maxWidth: "650px",
        hideCloseButton: true,
        closeOnNavigation: true,
        disableClose: true,
    } as DialogConfig;
};
export const CONFIRM_DIALOG_CONFIG = new InjectionToken<MatDialogConfig<any>>("ConfirmDialogConfig", {
    providedIn: "root",
    factory: () => configFactory(),
});

@Injectable({ providedIn: "root" })
export class ConfirmService {
    private readonly dialogConfig = inject(CONFIRM_DIALOG_CONFIG, { optional: true }) ?? configFactory();
    private readonly dialog = inject(DialogService);

    private _open(inputs: ComponentInputs<ConfirmComponent>, options?: ConfirmOptions): Promise<boolean> {
        const footer = makeFooter(options);
        const dRef = this.dialog.open(
            {
                component: ConfirmComponent,
                inputs,
            },
            {
                ...this.dialogConfig,
                ...options,
                footer,
            },
        );

        return firstValueFrom(dRef.afterClosed());
    }

    open(options?: ConfirmOptions): Promise<boolean> {
        const title = options?.title ?? "Confirmation Required";
        return this._open(
            {
                confirmTitle: title,
                confirmText: options?.confirmText ?? "Are you sure you want to proceed?",
                img: options?.img,
            },

            options,
        );
    }

    openWarning(options?: ConfirmOptions): Promise<boolean> {
        const title = options?.title ?? "Warning";

        return this._open(
            {
                confirmTitle: title,
                confirmText: options?.confirmText ?? "Are you sure you want to proceed?",
                img: options?.img,
            },
            options,
        );
    }
}

function makeFooter(options: ConfirmOptions) {
    const btn = ({ name, text }) =>
        ({
            name,
            text,
            type: "button",
        }) as ActionDescriptor;
    const yesBtn = btn({ name: "confirm", text: options?.yes ?? "Proceed" });
    const cancelBtn = btn({ name: "cancel", text: options?.no ?? "Cancel" });
    return [cancelBtn, yesBtn].map((b) => {
        return {
            component: MatBtnComponent,
            class: "action",
            inputs: {
                buttonDescriptor: b,
            },
            outputs: {
                action: async (e) => {
                    const dialogRef = inject(DialogRef);
                    const actionName = e.instance.buttonDescriptor().name;
                    dialogRef.close(actionName === "confirm");
                },
            },
        } as DynamicComponent<MatBtnComponent>;
    });
}
