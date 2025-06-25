import { Component, input, output, model } from "@angular/core";
import { AuthService } from "@upupa/auth";
import { TranslateService } from "@upupa/language";
import { FormDesign, FormScheme } from "@upupa/dynamic-form";
import { ActivatedRoute } from "@angular/router";
import { combineLatest, firstValueFrom, Subject } from "rxjs";
import { defaultVerifyCodeField } from "../default-values";
import { DataService } from "@upupa/data";
import { PromptService, SnackBarService } from "@upupa/dialog";
import { TitleCasePipe } from "@angular/common";

@Component({
    selector: "verify",
    templateUrl: "./verify.component.html",
    styleUrls: ["./verify.component.scss"],
    imports: [TitleCasePipe]
})
export class VerifyComponent {
    name = input<"phone" | "email" | "name">("email"); //what is to be verified (email,phone)
    value = model(""); //the value to be verifild (test@example.com) ...
    enableEdit = input(true);
    // appearance = 'outline';

    type = input<"code" | "token">("code");

    // code: string;
    token = input("");

    //verificatio msg info
    // @Input('verify-link') verifyLink: string;
    // image: string;
    // text: string;
    // editLink: string;

    success = output<boolean>();
    fail = output<any>();
    codeSent = output<void>();
    codeNotSent = output<any>();

    loading: boolean;

    model = {};
    form: FormScheme = defaultVerifyCodeField;

    editValueForm: FormScheme = {
        value: {
            input: "text",
            inputs: { label: "", placeholder: "" },
            validations: [{ name: "required" }],
        },
    };

    design: FormDesign = {
        verticalAlignment: "center",
        horizontalAlignment: "center",
    } as FormDesign;

    destroy = new Subject<void>();
    constructor(
        public auth: AuthService,
        private route: ActivatedRoute,
        private data: DataService,
        private snack: SnackBarService,
        private prompt: PromptService,
        public translator: TranslateService,
    ) {}
    async ngOnInit(): Promise<void> {
        try {
            const [ps, qps] = await firstValueFrom(combineLatest([this.route.params, this.route.queryParams]));
            // this.name ??= ps['name'] ?? 'email';
            // this.type = qps['token'] ? 'token' : 'code';
            this.value = qps[this.name()] ?? this.auth.user[this.name()];

            if (this.type() === "token") {
                this.token = qps["token"];
                await this.verify();
            }
        } catch (error) {
            console.error(error);
        }
    }

    formValueChange(v) {
        this.model = v;
        this.token = this.model["code"];
    }
    ngOnDestroy(): void {
        this.destroy.next();
        this.destroy.complete();
    }

    async resendCode() {
        try {
            this.loading = true;
            await this.auth.sendVerificationCode(this.name(), this.value(), {
                method: this.type(),
                id: this.auth.user.sub,
            });
            this.snack.openSuccess("sent");
            this.codeSent.emit();
        } catch (error) {
            if (error.status === 400) {
                const e = error.json();
                if (e.msg === "ALREADY_SENT") {
                    this.snack.openFailed("code-already-sent");
                    //const expire = e.expire; TODO
                } else this.snack.openFailed(e.msg);
            } else this.snack.openFailed("CODE_NOT_SENT");
            this.codeNotSent.emit(error);
        } finally {
            this.loading = false;
        }
    }

    async verify() {
        try {
            this.loading = true;
            if (this.type() !== "code" && this.type() !== "token") {
                this.snack.openWarning("token-type-error");
                return;
            }

            await this.auth.verify(this.name(), {
                type: this.type(),
                token: this.token(),
                value: this.value(),
            });

            await this.auth.refresh();
            this.success.emit(true);
            this.snack.openSuccess();
        } catch (error) {
            this.fail.emit(error);
            this.snack.openFailed(error);
        } finally {
            this.loading = false;
        }
    }

    async editValue() {
        const value = await this.prompt.open({
            value: this.value(),
            placeholder: this.name(),
            required: true,
            actionText: "Submit"
        });

        if (value && value !== this.value) {
            try {
                await this.data.patch(`/user/${this.auth.user.sub}`, [{ path: this.name(), value, op: "replace" }]);
                await this.auth.refresh();
                this.value = value;

                await this.resendCode();
            } catch (error) {
                this.snack.openFailed();
            }
        }
    }
}
