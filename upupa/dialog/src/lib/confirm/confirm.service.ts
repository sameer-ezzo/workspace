import { Injectable } from "@angular/core";
import { MatDialogConfig } from "@angular/material/dialog";
import { firstValueFrom } from "rxjs";
import { first, map } from "rxjs/operators";
import { DialogService, DialogServiceConfig } from "../dialog.service";
import { ConfirmComponent } from "./confirm.component";
import { ActionDescriptor } from "@upupa/common";

@Injectable({ providedIn: "root" })
export class ConfirmService {
    constructor(private dialog: DialogService) { }

    open(options?: ConfirmOptions): Promise<boolean> {
        const o = Object.assign(new ConfirmOptions(), options);
        const { title, img, confirmText, no, yes, yesColor } = { ...options };
        return firstValueFrom(
            this.dialog
                .openDialog(ConfirmComponent, {
                    width: "auto",
                    maxWidth: "450px",
                    ...o,
                    hideCloseBtn: true,
                    disableClose: true,
                    closeOnNavigation: true,
                    actions: [
                        {
                            meta: { closeDialog: true },
                            name: "no",
                            variant: "button",
                            type: 'button',
                            text: o.no ?? "No"
                        } as ActionDescriptor,
                        {
                            meta: { closeDialog: true },
                            name: "yes",
                            type: "submit",
                            color: o.yesColor ?? "primary",
                            variant: "stroked",
                            text: o.yes ?? "Yes",
                        } as ActionDescriptor,
                    ],
                    
                    title,
                    img,
                    confirmText,
                } as DialogServiceConfig<any>)
                .afterClosed()
                .pipe(map((v) => v))
        );
    }

    openWarning(options?: ConfirmOptions): Promise<boolean> {
        const o = Object.assign(new ConfirmOptions(), options, {
            yesColor: "warn",
            width: "95%",
            maxWidth: "450px",
        });
        return this.open(o);
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
