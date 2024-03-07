import { Injectable } from "@angular/core";
import { MatDialogConfig } from "@angular/material/dialog";

import { firstValueFrom } from "rxjs";
import { DialogService } from "../dialog.service";
import { ActionDescriptor } from "../mat-btn/action-descriptor";
import { PromptComponent } from "./prompt.component";

@Injectable({ providedIn: "root" })
export class PromptService {
  constructor(private dialog: DialogService) {}

  open(options?: PromptOptions, dialogConfig?: MatDialogConfig): Promise<any> {
    const o = Object.assign(new PromptOptions(), options);
    return firstValueFrom(
      this.dialog
        .openDialog(PromptComponent, {
          hideCloseBtn: true,
          actions: [
            {
              meta: { closeDialog: true },
              action: "yes",
              color: "primary",
              variant: "raised",
              text: o.yes ?? "Yes",
            } as ActionDescriptor,
          ],
          ...o,
          width: "auto",
          ...(dialogConfig ?? {}),
        })
        .afterClosed()
    );
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
