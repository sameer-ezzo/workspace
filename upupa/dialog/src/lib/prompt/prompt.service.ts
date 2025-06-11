import { inject, Injectable, InjectionToken } from "@angular/core";
import { MatDialogConfig } from "@angular/material/dialog";

import { firstValueFrom } from "rxjs";
import { DialogConfig, DialogService } from "../dialog.service";
import { PromptComponent } from "./prompt.component";
import { MatBtnComponent } from "@upupa/mat-btn";
import { DialogRef } from "../dialog-ref";

const config_factory = (): DialogConfig => ({
    width: "100%",
    maxWidth: "650px",
    autoFocus: "#prompt-input",
    hideCloseButton: false,
    closeOnNavigation: false,
    disableClose: true,
});
export const PROMPT_DIALOG_CONFIG = new InjectionToken<DialogConfig>("PromptDialogConfig", {
    providedIn: "root",
    factory: config_factory,
});
@Injectable({ providedIn: "root" })
export class PromptService {
    private readonly promptDialogConfig = inject(PROMPT_DIALOG_CONFIG, { optional: true }) ?? config_factory();
    constructor(private dialog: DialogService) {}

    async open(options?: PromptOptions, dialogConfig?: MatDialogConfig): Promise<any> {
        const o = Object.assign(new PromptOptions(), options);

        return firstValueFrom(
            this.dialog
                .open(
                    {
                        component: PromptComponent,
                        inputs: {
                            promptText: o.text,
                            placeholder: o.placeholder,
                            type: o.type,
                            required: o.required,
                            appearance: "outline",
                            view: o.view,
                            value: o.value,
                            rows: o.rows,
                        },
                        outputs: {
                            submit: (e) => {
                                const dialogRef = inject(DialogRef);
                                if (e === undefined || e === null) {
                                    dialogRef.close();
                                } else {
                                    dialogRef.close(e.instance.valueFormControl.value as any);
                                }
                            },
                        },
                    },
                    {
                        ...this.promptDialogConfig,
                        title: o.title,
                        ...(dialogConfig ?? {}),
                        footer: [
                            {
                                component: MatBtnComponent,
                                inputs: { buttonDescriptor: { name: "submit", text: o.actionText, type: "submit" } },
                                outputs: {
                                    action: async (e) => {
                                        const dialogRef = inject(DialogRef);
                                        const compRef = await firstValueFrom(dialogRef.afterAttached());
                                        compRef.instance.submitOnEnter(e);
                                    },
                                },
                            },
                        ],
                    } as DialogConfig,
                )
                .afterClosed(),
        );
    }
}

export class PromptOptions {
    view?: "input" | "textarea" = "input";
    text? = "Please enter value";
    title? = "Prompt";
    placeholder?: string;
    value?: string;
    type?: string;
    required?: boolean;
    rows?: number = 10;
    actionText?: string = "Submit";
    constructor(init?: Partial<PromptOptions>) {
        Object.assign(this, init);
    }
}
