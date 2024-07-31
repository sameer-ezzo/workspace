import { Component, Input, Optional, Output, EventEmitter } from '@angular/core';
import { AuthService } from '@upupa/auth';
import { HttpClient } from '@angular/common/http';
import { MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldAppearance } from '@angular/material/form-field';
import { firstValueFrom } from 'rxjs';
import { SnackBarService } from '@upupa/dialog';

@Component({
  selector: 'change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css']
})
export class ChangePasswordComponent {
  loading = false;

  oldPassword: string;
  newPassword: string;
  confirmPassword: string;

  @Input() appearance : MatFormFieldAppearance = 'fill';
  @Output() passwordChanged = new EventEmitter<boolean>();

  constructor(
    private auth: AuthService,
    public http: HttpClient,
    public snack: SnackBarService,
    @Optional() public dialogRef: MatDialogRef<ChangePasswordComponent>) {
  }

  async changePassword() {
    try {
      await firstValueFrom(this.http.post(`${this.auth.baseUrl}/changepassword/${this.auth.user.sub}`, { old_password: this.oldPassword, new_password: this.newPassword }));
      this.passwordChanged.emit(true);
      this.snack.openSuccess();
    } catch (error) {
      this.snack.openFailed();
      console.error(error);
    }
  }

}
