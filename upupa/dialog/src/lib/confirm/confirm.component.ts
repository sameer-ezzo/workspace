import {
  Component,
  Optional,
  Inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';

import { ActionEvent } from '@upupa/common';
import { UpupaDialogComponent } from '../upupa-dialog.component';
import { MatBtnComponent } from '@upupa/mat-btn';

@Component({
  selector: 'confirm',
  
  imports: [MatDialogModule, MatBtnComponent],
  templateUrl: 'confirm.component.html',
  styleUrls: ['confirm.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmComponent {
  confirmText = 'Do you confirm?';
  confirmTitle = 'Confirmation';
  confirmNoButton = 'No';
  confirmYesButton = 'Yes';
  img: string;

  constructor(@Optional() @Inject(MAT_DIALOG_DATA) public data: any) {
    if (data.title !== undefined) {
      this.confirmTitle = data.title;
    }
    if (data.img !== undefined) {
      this.img = data.img;
    }
    if (data.confirmText !== undefined) {
      this.confirmText = data.confirmText;
    }
    if (data.yes !== undefined) {
      this.confirmYesButton = data.yes;
    }
    if (data.no !== undefined) {
      this.confirmNoButton = data.no;
    }
  }

  async onAction(e: ActionEvent) {
    const dialogRef = e.context.dialogRef;
    return dialogRef.close(e.action.name === 'yes');
  }
}
