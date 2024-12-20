import { Component, SimpleChanges, input, output, signal } from "@angular/core";
import { AuthService } from "@upupa/auth";
import { DataService } from "@upupa/data";
import { Subscription, takeWhile } from "rxjs";
import { DynamicFormComponent, emailField, Field, textField } from "@upupa/dynamic-form";
import { languageDir, LanguageService } from "@upupa/language";
import { MatInputComponent } from "@upupa/dynamic-form-material-theme";
import { SnackBarService } from "@upupa/dialog";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";

@Component({
    standalone: true,
    selector: "change-user-prop",
    templateUrl: "./change-user-prop.component.html",
    imports: [MatIconModule, DynamicFormComponent, MatButtonModule],
})
export class ChangeUserPropComponent<T = any> extends MatInputComponent {
    propToBeChanged = input<"phone" | "email" | "name">("name", {
        alias: "prop",
    });
    changed = output<{ oldValue: T; newValue: T }>();

    editing = signal(false);
    sub: Subscription;
    user: any;
    dir: "ltr" | "rtl" = "rtl";

    fileds: any;
    formData: { [key: string]: any };

    constructor(
        public data: DataService,
        private ls: LanguageService,
        public auth: AuthService,
        public snack: SnackBarService,
    ) {
        super();
    }

    ngOnInit() {
        this.sub = this.auth.user$.pipe(takeWhile((x) => this.editing() === false)).subscribe((u) => {
            if (u) {
                this.user = u;
                this.formData = {
                    [this.propToBeChanged()]: u[this.propToBeChanged()],
                };
            }
        });
    }

    ngOnChanges(changes: SimpleChanges) {
        this._generateFields(this.propToBeChanged());
    }
    valueChanged(v: any) {
        this.value.set(v[this.propToBeChanged()]);
    }

    revert() {
        this.value.set(this.user[this.propToBeChanged()]);
    }
    private _generateFields(propToBeChanged: string) {
        if (!this.propToBeChanged) throw new Error("Property to be changed should be provided.");

        this.dir = "ltr";
        switch (this.propToBeChanged()) {
            case "email":
                this.fileds = {
                    [this.propToBeChanged()]: emailField(this.propToBeChanged(), this.label(), this.placeholder(), this.hint(), this.appearance()),
                };
                break;
            case "phone":
                this.fileds = {
                    [this.propToBeChanged()]: {
                        input: "phone",
                        name: this.propToBeChanged(),
                        inputs: {
                            appearance: this.appearance(),
                            label: this.label(),
                            placeholder: this.placeholder(),
                        },
                    } as Field,
                };
                break;
            case "name":
                this.dir = languageDir(this.ls.language);
                this.fileds = {
                    [this.propToBeChanged()]: textField(this.propToBeChanged(), this.label(), this.placeholder(), this.hint(), this.appearance(), [{ name: "latin" }]),
                };
                break;
        }
    }

    ngOnDestroy() {
        if (this.sub) this.sub.unsubscribe();
    }
    async changeProp() {
        try {
            const e = {
                oldValue: this.user[this.propToBeChanged()],
                newValue: this.value(),
            };
            await this.data.patch(`/user/${this.user.sub}`, [
                {
                    op: "replace",
                    path: "/" + this.propToBeChanged(),
                    value: this.value(),
                },
            ]);
            await this.auth.refresh();
            this.value.set(this.user[this.propToBeChanged()]);

            this.changed.emit(e);
        } catch (error) {
            if (error.status === 500) {
                const e = error.error;
                if (e.message.indexOf("duplicate key") > -1) {
                    this.snack.openFailed("duplicate-phone");
                }
            } else {
                this.snack.openFailed("not-saved");
                console.error(error);
            }
        }
    }
}
