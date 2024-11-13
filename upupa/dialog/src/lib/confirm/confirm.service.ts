import { Injectable } from "@angular/core";
import { MatDialogConfig } from "@angular/material/dialog";
import { firstValueFrom } from "rxjs";
import { first, map } from "rxjs/operators";
import { DialogService, DialogServiceConfig } from "../dialog.service";
import { ConfirmComponent } from "./confirm.component";
import { ActionDescriptor } from "@upupa/common";

@Injectable({ providedIn: "root" })
export class ConfirmService {
    constructor(private dialog: DialogService) {}

    open(options?: ConfirmOptions): Promise<boolean> {
        const o = this._makeOptions(options);

        const dRef = this.dialog.openDialog(ConfirmComponent, o);

        return firstValueFrom(dRef.afterClosed());
    }

    private _makeOptions(options: ConfirmOptions) {
        const o = Object.assign({}, new ConfirmOptions(), {
            maxWidth: "450px",
            width: "90%",
            hideCloseButton: true,
            closeOnNavigation: true,
        }) as DialogServiceConfig;

        if (options?.title) o.title = options.title;
        o.inputs ??= {};
        if (options?.confirmText) o.inputs["confirmText"] = options.confirmText;
        if (options.img) o.inputs["img"] = options.img;
        o.inputs["discardButton"] = { name: "no", variant: "button", type: "button", text: options.no ?? "Discard" } as ActionDescriptor;
        o.inputs["confirmButton"] = { name: "yes", type: "submit", color: options.yesColor ?? "primary", variant: "raised", text: options.yes ?? "Confirm" } as ActionDescriptor;

        return o;
    }

    openWarning(options?: ConfirmOptions): Promise<boolean> {
        const o = this._makeOptions(options);
        o.inputs["confirmButton"] ??= {};
        o.inputs["confirmButton"].color = "warn";
        o.inputs["confirmButton"].text = options.yes ?? "Proceed";
        const dRef = this.dialog.openDialog(ConfirmComponent, o);
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
