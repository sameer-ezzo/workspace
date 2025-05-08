import { ComponentRef } from "@angular/core";

import { Observable, ReplaySubject } from "rxjs";
import { DialogWrapperComponent } from "./dialog-wrapper.component";
import { MatDialogRef } from "@angular/material/dialog";

// export type DialogRefD<P = any> = DialogConfig<P> & {
//     data: P & {
//         component: DynamicComponent;
//         dialogRef: MatDialogRef<any>;
//     } & Record<string, any>;
// };

export class DialogRef<TComponent = any, TDialogResult = any> extends MatDialogRef<DialogWrapperComponent<TComponent>, TDialogResult> {
    afterAttached: () => Observable<ComponentRef<TComponent>>;

    static create<TComponent = any, TDialogResult = any>(dialogRef: MatDialogRef<DialogWrapperComponent<TComponent>, TDialogResult>) {
        dialogRef["_afterAttached"] = new ReplaySubject<ComponentRef<TComponent>>(1);
        dialogRef["afterAttached"] = () => dialogRef["_afterAttached"].asObservable();
        return dialogRef as DialogRef<TComponent, TDialogResult>;
    }
}
