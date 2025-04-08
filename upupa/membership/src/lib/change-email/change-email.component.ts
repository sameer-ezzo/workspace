import { Component, OnInit, Input, Output, EventEmitter, SimpleChanges } from "@angular/core";
import { AuthService } from "@upupa/auth";
import { DataService } from "@upupa/data";
import { Subscription } from "rxjs";
import { emailPattern } from "../patterns";
import { FormControl, NgModel } from "@angular/forms";
import { SnackBarService } from "@upupa/dialog";
import { ChangeUserPropComponent } from "../change-user-prop/change-user-prop.component";

@Component({
    selector: "change-email",
    templateUrl: "./change-email.component.html",
    imports: [ChangeUserPropComponent]
})
export class ChangeEmailComponent {
    @Input() appearance = "fill";
    @Input() name = "email";
    @Output() changed = new EventEmitter<boolean>();

    @Input() emailPattern = emailPattern;

    control = new FormControl();

    user: any;
    email = "";
    readonly = true;
    disabled = false;
    sub: Subscription;

    constructor(
        public data: DataService,
        public auth: AuthService,
        public snack: SnackBarService,
    ) {}
    ngOnInit() {
        this.sub = this.auth.user$.subscribe(async (u) => {
            if (u) {
                this.user = u;
                this.email = u.email;
            }
        });
    }
    ngOnChanges(changes: SimpleChanges) {
        if (changes["email"]) {
            if (this.readonly === false) this.email = changes["email"].previousValue;
        }
    }

    ngOnDestroy() {
        if (this.sub) this.sub.unsubscribe();
    }
    async changeEmail(emailInput: NgModel) {
        if (this.auth.user.email === emailInput.value) {
            this.readonly = true;
            return;
        }

        this.disabled = true;
        try {
            await this.data.put(`/user/${this.user().sub}/email`, this.email);
            await this.auth.refresh();
            this.snack.openSuccess();
            this.changed.emit(true);
            this.readonly = true;
        } catch (error) {
            if (error.status === 500) {
                const e = error.error;
                if (e.message.indexOf("duplicate key") > -1) {
                    this.snack.openFailed("duplicate-email");
                    emailInput?.control?.setErrors({ "duplicate-email": true });
                }
            } else {
                this.snack.openFailed("not-saved");
                console.error(error);
            }
        } finally {
            this.disabled = false;
        }
    }
}
