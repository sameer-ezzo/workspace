import { Component, input } from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "@upupa/auth";
import { HttpClient } from "@angular/common/http";
import { TranslateService } from "@upupa/language";
import { ActionEvent } from "@upupa/common";
import { firstValueFrom } from "rxjs";
import { MatFormField, MatHint } from "@angular/material/form-field";
import type { MatFormFieldAppearance } from "@angular/material/form-field";
import { SnackBarService } from "@upupa/dialog";
import { FormsModule } from "@angular/forms";
@Component({
    selector: "admin-reset-pwd",
    templateUrl: "./admin-reset-pwd.component.html",
    styles: [
        `
            .full-width {
                width: 100%;
            }
        `,
    ],
    imports: [FormsModule, MatFormField, MatHint]
})
export class AdminResetPasswordComponent {
    loading = false;

    readonly email = input<string>(undefined);
    readonly appearance = input<MatFormFieldAppearance>("outline");

    password!: string;
    confirmPassword!: string;

    constructor(
        private auth: AuthService,
        public http: HttpClient,
        public snack: SnackBarService,
        public router: Router,
        public translator: TranslateService,
    ) {}
    async onAction(e: ActionEvent) {
        if (e.descriptor.name === "reset") return await this.reset();
        else return e;
    }
    async reset() {
        try {
            this.loading = true;
            const base = this.auth.baseUrl;
            await firstValueFrom(this.http.post(`${base}/adminreset`, { email: this.email(), new_password: this.password }));
        } catch (error) {
            this.snack.openFailed();
        } finally {
            this.loading = false;
        }
    }
}
