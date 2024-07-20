import { Component, Input } from '@angular/core';
import { Router } from "@angular/router";
import { AuthService } from '@upupa/auth';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@upupa/language';
import { ActionEvent, SnackBarService } from '@upupa/common';
import { firstValueFrom } from 'rxjs';
import { MatFormFieldAppearance } from '@angular/material/form-field';
@Component({
    selector: 'admin-reset-pwd',
    templateUrl: './admin-reset-pwd.component.html',
    styles: [`.full-width{width: 100%}`]
})
export class AdminResetPasswordComponent {
    loading = false;

    @Input() email: string;
    @Input() appearance: MatFormFieldAppearance = 'outline';

    password: string;
    confirmPassword: string;

    constructor(private auth: AuthService,
        public http: HttpClient,
        public snack: SnackBarService,
        public router: Router,
        public translator: TranslateService) {
    }
    async onAction(e: ActionEvent) {
        if (e.action.name === 'reset') return await this.reset()
        else return e
    }
    async reset() {
        try {
            this.loading = true;
            const base = this.auth.baseUrl;
            await firstValueFrom(this.http.post(`${base}/adminreset`, { email: this.email, new_password: this.password }));
        } catch (error) {
            this.snack.openFailed();
        } finally {
            this.loading = false;
        }
    }
}