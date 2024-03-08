import { Component, Optional, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ActionEvent } from '../mat-btn/action-descriptor';
import { UpupaDialogComponent } from '../upupa-dialog/upupa-dialog.component';


@Component({
  selector: 'confirm',
  templateUrl: 'confirm.component.html',
  styleUrls: ['confirm.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfirmComponent {

  confirmText = 'Do you confirm?';
  confirmTitle = 'Confirmation';
  confirmNoButton = 'No';
  confirmYesButton = 'Yes';
  img: string;

  constructor(@Optional() @Inject(MAT_DIALOG_DATA) public data: any) {
    if (data.title !== undefined) { this.confirmTitle = data.title; }
    if (data.img !== undefined) { this.img = data.img; }
    if (data.confirmText !== undefined) { this.confirmText = data.confirmText; }
    if (data.yes !== undefined) { this.confirmYesButton = data.yes; }
    if (data.no !== undefined) { this.confirmNoButton = data.no; }
  }

  onAction(e: ActionEvent, dialogRef: MatDialogRef<UpupaDialogComponent, boolean>) {
    return dialogRef.close(e.action.action === 'yes')
  }
}
