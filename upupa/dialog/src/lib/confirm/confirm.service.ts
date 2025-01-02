import { Injectable } from "@angular/core";
import { MatDialogConfig } from "@angular/material/dialog";
import { firstValueFrom } from "rxjs";
import { first, map } from "rxjs/operators";
import { DialogService, DialogConfig } from "../dialog.service";
import { ConfirmComponent } from "./confirm.component";
import { ActionDescriptor } from "@upupa/common";

@Injectable({ providedIn: "root" })
export class ConfirmService {
    constructor(private dialog: DialogService) {}

    open(options?: ConfirmOptions): Promise<boolean> {
        const o = this._makeOptions(options);

        const dRef = this.dialog.open(
            {
                component: ConfirmComponent,
                inputs: {
                    confirmText: options?.confirmText,
                    img: options?.img,
                    discardButton: { color: "accent", text: options.no ?? "Cancel" },
                    confirmButton: { color: "warn", text: options.yes ?? "Proceed" },
                },
            },
            o,
        );

        return firstValueFrom(dRef.afterClosed());
    }

    private _makeOptions(options: ConfirmOptions) {
        const o = Object.assign({}, new ConfirmOptions(), {
            maxWidth: "450px",
            width: "90%",
            hideCloseButton: true,
            closeOnNavigation: true,
        }) as DialogConfig;

        if (options?.title) o.title = options.title;

        return o;
    }

    openWarning(options?: ConfirmOptions): Promise<boolean> {
        const o = this._makeOptions(options);
        const dRef = this.dialog.open(
            {
                component: ConfirmComponent,
                inputs: {
                    confirmText: options?.confirmText,
                    img: options?.img,
                    discardButton: { color: "accent", text: options.no ?? "Cancel" },
                    confirmButton: { color: "warn", text: options.yes ?? "Proceed" },
                },
            },
            o,
        );

        return firstValueFrom(dRef.afterClosed());
    }
}

export class ConfirmOptions extends MatDialogConfig<any> {
    title?: string;
    img?: string;
    confirmText?: string;
    no?: string;
    yes?: string;
    yesColor?: "primary" | "accent" | "warn";
}
