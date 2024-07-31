import { Injectable, inject } from "@angular/core";
import { FormScheme } from "./types/types";
import { DynamicFormComponent } from "./dynamic-form.component";
import { MatDialogRef } from "@angular/material/dialog";
import { DialogService, DialogServiceConfig, UpupaDialogComponent } from "@upupa/dialog";

@Injectable({ providedIn: 'root' })
export class DynamicFormDialogService {
  private readonly dialog = inject(DialogService);
  open<D extends Record<string, unknown>, O = any, R = any>(scheme: FormScheme, value?: D, dialogOptions: DialogServiceConfig<O> = {}): MatDialogRef<UpupaDialogComponent, R> {
    const options = {
      width: "100%",
      maxWidth: "450px",
      maxHeight: "80vh",
      ...dialogOptions,
      actions: dialogOptions?.actions ?? [
        { action: 'submit', text: 'Submit', color: 'primary', type: 'submit' },
        { action: 'discard', text: 'Discard', color: 'warn', type: 'button' }
      ],
      inputs: {
        ...dialogOptions?.inputs,
        scheme,
        value
      },
    } as DialogServiceConfig<O>;

    return this.dialog.openDialog(DynamicFormComponent, options);
  }
}
