import { Component, Input, Output, EventEmitter, ViewChild, inject, signal } from '@angular/core';
import { AuthService } from '@upupa/auth';
import { ActionDescriptor } from '@upupa/common';
import { CollectorComponent, FormScheme } from '@upupa/dynamic-form';
import { defaultSignupFormFields } from '../default-values';
import { Condition } from '@noah-ark/expression-engine';
import { FormControl } from '@angular/forms';

@Component({
    selector: 'signup-form',
    styleUrls: ['./signup-form.component.scss'],
    templateUrl: './signup-form.component.html'
})
export class SignUpFormComponent {
    @ViewChild('signupForm') signupForm: CollectorComponent;
    loading = signal<boolean>(false);
    public readonly auth: AuthService = inject(AuthService);

    control = new FormControl();
    @Output() success = new EventEmitter();
    @Output() fail = new EventEmitter();

    @Input() model: any = {};
    @Input() submitBtn: ActionDescriptor = { name: 'signup', type: 'submit', text: 'Signup', color: 'primary', variant: 'raised' };
    @Input() fields: FormScheme = defaultSignupFormFields;
    @Input() conditions: Condition[] = []



    async signup(model) {
        if (this.signupForm.canGoNext()) {
            this.signupForm.next();
            return;
        }

        try {
            this.model = model;
            this.loading.set(true)
            if (!this.model.username) this.model.username = this.model.email; //auto save email as username if not provided

            const user: any = { ...this.model };
            delete user.password;
            delete user.confirmPassword;
            let value = user;

            let res = await this.auth.signup(value, this.model.password);
            let res2 = await this.auth.signin({ email: user.email, password: this.model.password });
            this.success.emit(res);
        }
        catch (error) {
            this.fail.emit(error);

            // if (error.status === 500) {
            //     const e = error.json ? error.json() : error.body;
            //     if (e.message && e.message.indexOf("duplicate key") > -1) {
            //         if (e.message.indexOf("index: email") > -1) this.snack.openFailed('duplicate-email');
            //         else if (e.message.indexOf("index: username") > -1) this.snack.openFailed('duplicate-username');
            //         else if (e.message.indexOf("index: phone") > -1) this.snack.openFailed('duplicate-phone');
            //         else this.snack.openFailed('not-saved');
            //     }
            // }
            // else this.snack.openFailed('not-saved');

        }
        finally {
            this.loading.set(false);
        }
    }
}