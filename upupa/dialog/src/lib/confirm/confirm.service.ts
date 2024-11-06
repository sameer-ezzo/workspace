import { Injectable } from '@angular/core';
import { MatDialogConfig } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { first, map } from 'rxjs/operators';
import { DialogService, DialogServiceConfig } from '../dialog.service';
import { ConfirmComponent } from './confirm.component';
import { ActionDescriptor } from '@upupa/common';

@Injectable({ providedIn: 'root' })
export class ConfirmService {
    constructor(private dialog: DialogService) {}

    open(options?: ConfirmOptions): Promise<boolean> {
        const o = Object.assign(new ConfirmOptions(), options);

        const dRef = this.dialog.openDialog(ConfirmComponent, {
            width: '450px',
            maxWidth: '90%',
            hideCloseButton: true,
            closeOnNavigation: true,
            title: o.title,
            inputs: {
                confirmText: o.confirmText,
                img: o.img,
                confirmButton: {
                    name: 'yes',
                    type: 'submit',
                    color: o.yesColor ?? 'primary',
                    variant: 'raised',
                    text: o.yes ?? 'Yes',
                },

                discardButton: {
                    name: 'no',
                    variant: 'button',
                    type: 'button',
                    text: o.no ?? 'No',
                } as ActionDescriptor,
            },
        } as DialogServiceConfig<any>);

        return firstValueFrom(dRef.afterClosed());
    }

    openWarning(options?: ConfirmOptions): Promise<boolean> {
        const o = Object.assign(new ConfirmOptions(), options, {
            yesColor: 'warn',
            width: '95%',
            maxWidth: '450px',
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
    yesColor?: 'primary' | 'accent' | 'warn';
}
