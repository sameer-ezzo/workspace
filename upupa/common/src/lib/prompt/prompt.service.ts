import { Injectable } from "@angular/core";
import { MatDialogConfig } from "@angular/material/dialog";

import { firstValueFrom } from "rxjs";
import { DialogService } from "../dialog.service";
import { ActionDescriptor } from "../mat-btn/action-descriptor";
import { PromptComponent } from "./prompt.component";

@Injectable({ providedIn: "root" })
export class PromptService {
  constructor(private dialog: DialogService) { }

  async open(options?: PromptOptions, dialogConfig?: MatDialogConfig): Promise<any> {
    const o = Object.assign(new PromptOptions(), options);
    const closable = o.required !== true;
    const _options = {
      hideCloseBtn: closable,
      disableClose: !closable,
      canEscape: closable,
      ...o,
      width: "auto",
      ...(dialogConfig ?? {}),

      dialogActions: [
        {
          action: "yes",
          color: "primary",
          variant: "raised",
          text: o.yes ?? "Yes",
          type: "submit",
        } as ActionDescriptor,
      ]
    } as MatDialogConfig;

    return await firstValueFrom(this.dialog.openDialog(PromptComponent, _options).afterClosed())
  }
}

export class PromptOptions {
  text? = "Please enter value";
  title? = "Prompt";
  no? = "No";
  yes? = "Yes";
  placeholder?: string;
  value?: string;
  type?: string;
  required?: boolean;
}
