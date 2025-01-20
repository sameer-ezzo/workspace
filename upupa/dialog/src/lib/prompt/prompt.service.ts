import { ComponentRef, Injectable, output } from "@angular/core";
import { MatDialogConfig } from "@angular/material/dialog";

import { firstValueFrom } from "rxjs";
import { DialogService } from "../dialog.service";
import { PromptComponent } from "./prompt.component";
import { ActionDescriptor } from "@upupa/common";
import { MatBtnComponent } from "@upupa/mat-btn";

@Injectable({ providedIn: "root" })
export class PromptService {
    constructor(private dialog: DialogService) {}

    async open(options?: PromptOptions, dialogConfig?: MatDialogConfig): Promise<any> {
        const btn = { ...new PromptOptions().submitBtn, ...options?.submitBtn };
        const o = Object.assign(new PromptOptions(), options, { submitBtn: btn });
        const closable = o.required !== true;

        return firstValueFrom(
            this.dialog
                .open(
                    {
                        component: PromptComponent,
                        inputs: {
                            promptText: o.text,
                            promptNoButton: o.no,
                            promptYesButton: o.yes,
                            placeholder: o.placeholder,
                            type: o.type,
                            required: o.required,
                            appearance: "outline",
                            view: o.view,
                            value: o.value,
                            submitBtn: o.submitBtn,
                        },
                    },
                    {
                        title: o.title,
                        hideCloseButton: !closable,
                        disableClose: !closable,
                        closeOnNavigation: closable,
                        width: "auto",
                        ...(dialogConfig ?? {}),
                    } as MatDialogConfig,
                )
                .afterClosed(),
        );
    }
}

export class PromptOptions {
    view?: "input" | "textarea" = "input";
    text? = "Please enter value";
    title? = "Prompt";
    no? = "No";
    yes? = "Yes";
    placeholder?: string;
    value?: string;
    type?: string;
    required?: boolean;
    submitBtn?: ActionDescriptor = { name: "submit", text: "Submit", type: "submit", color: "primary", variant: "raised" };
}
