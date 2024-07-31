import { Component, Input, Output, EventEmitter } from '@angular/core';
import { AuthService } from '@upupa/auth';
import { TranslateService } from '@upupa/language';
import { ErrorService } from '@upupa/common';
import { FormDesign, FormScheme } from '@upupa/dynamic-form';
import { ActivatedRoute } from '@angular/router';
import { combineLatest, firstValueFrom, Subject } from 'rxjs';
import { defaultVerifyCodeField } from '../default-values';
import { DataService } from '@upupa/data';
import { PromptService, SnackBarService } from '@upupa/dialog';

@Component({
    selector: 'verify',
    templateUrl: './verify.component.html',
    styleUrls: ['./verify.component.scss']
})
export class VerifyComponent {

    @Input() name: 'phone' | 'email' | 'name' = 'email'; //what is to be verified (email,phone)
    @Input() value: string; //the value to be verifild (test@example.com) ...
    @Input() enableEdit = true;
    // @Input() appearance = 'outline';

    @Input() type: 'code' | 'token' = 'code';

    // @Input() code: string;
    @Input() token: string;

    //verificatio msg info
    // @Input('verify-link') verifyLink: string;
    // @Input() image: string;
    // @Input() text: string;
    // @Input() editLink: string;


    @Output() success = new EventEmitter();
    @Output() fail = new EventEmitter();
    @Output() codeSent = new EventEmitter();
    @Output() codeNotSent = new EventEmitter();

    loading: boolean;


    model = {};
    form: FormScheme = defaultVerifyCodeField;

    editValueForm: FormScheme = {
        value: { type: 'field', input: 'text', name: 'value', ui: { inputs: { label: '', placeholder: '' } }, validations: [{ name: 'required' }] },
    };

    design: FormDesign = {
        verticalAlignment: 'center',
        horizontalAlignment: 'center'
    } as FormDesign;


    destroy = new Subject<void>();
    constructor(public auth: AuthService,
        private errorservice: ErrorService,
        private route: ActivatedRoute,
        private data: DataService,
        private snack: SnackBarService,
        private prompt: PromptService,
        public translator: TranslateService) {
    }
    async ngOnInit(): Promise<void> {
        try {
            const [ps, qps] = await firstValueFrom(combineLatest([this.route.params, this.route.queryParams]));
            this.name ??= ps['name'] ?? 'email';
            this.type = qps['token'] ? 'token' : 'code';
            this.value = qps[this.name] ?? this.auth.user[this.name];

            if (this.type === 'token') {
                this.token = qps['token'];
                await this.verify()
            }
        } catch (error) {
            console.error(error);
        }
    }

    formValueChange(v) {
        this.model = v;
        this.token = this.model['code'];
    }
    ngOnDestroy(): void {
        this.destroy.next();
        this.destroy.complete();
    }

    async resendCode() {
        try {
            this.loading = true;
            await this.auth.sendVerificationCode(this.name, this.value, { method: this.type, id: this.auth.user.sub });
            this.snack.openSuccess('sent');
            this.codeSent.emit();
        } catch (error) {
            if (error.status === 400) {
                const e = error.json();
                if (e.msg === "ALREADY_SENT") {
                    this.snack.openFailed('code-already-sent');
                    //const expire = e.expire; TODO
                }
                else this.snack.openFailed(e.msg);
            }
            else this.snack.openFailed('CODE_NOT_SENT');
            this.codeNotSent.emit(error);
        }
        finally { this.loading = false; }
    }

    async verify() {
        try {
            this.loading = true;
            if (this.type != 'code' && this.type != 'token') {
                this.snack.openWarning('token-type-error')
                return
            }

            await this.auth.verify(this.name, { type: this.type, token: this.token, value: this.value })

            await this.auth.refresh()
            this.success.emit(true)
            this.snack.openSuccess()
        } catch (error) {

            const e = this.errorservice.normalize(error);
            this.fail.emit(e);
            this.snack.openFailed(e.message);
        }
        finally { this.loading = false; }
    }

    async editValue() {
        const value = await this.prompt.open({
            value: this.value,
            placeholder: this.name,
            required: true,
            yes: 'submit',
            no: 'cancel'
        })

        if (value && value !== this.value) {
            try {
                await this.data.patch(`/user/${this.auth.user.sub}`, [{ path: this.name, value, op: 'replace' }])
                await this.auth.refresh()
                this.value = value

                await this.resendCode();
            } catch (error) {
                this.snack.openFailed();
            }
        }
    }

}
