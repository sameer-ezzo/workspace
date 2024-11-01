import { Component, Input, Output, EventEmitter, inject, signal, ViewChild, output, viewChild, model } from '@angular/core';
import { AuthService, Credentials } from '@upupa/auth';
import { CollectorComponent, FormScheme } from '@upupa/dynamic-form';
import { ActionDescriptor } from '@upupa/common';
import { defaultLoginFormFields } from '../default-values';
import { Condition } from '@noah-ark/expression-engine';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import { Principle } from '@noah-ark/common';

@Component({
    selector: 'login-form',
    styleUrls: ['./login-form.component.scss'],
    templateUrl: './login-form.component.html',
})
export class LoginFormComponent {
    loginForm = viewChild<CollectorComponent>('loginForm');
    private readonly auth = inject(AuthService);
    loading = signal(false);
    error: string;

    control = new FormControl();

    success = output<Principle | { type: 'reset-pwd'; reset_token: string }>();
    resetPassword = output<{ reset_token: string }>();
    fail = output<any>();

    value = model<{ email: string; password: string; rememberMe?: boolean }>();
    @Input() submitBtn: ActionDescriptor = {
        name: 'login',
        type: 'submit',
        text: 'login',
        color: 'primary',
        variant: 'raised',
    };
    @Input() fields: FormScheme = defaultLoginFormFields;
    @Input() conditions: Condition[] = [];

    async signin() {
        this.error = null;
        const form = this.loginForm().ngForm();
        this.loading.set(true);

        try {
            const res = await this.auth.signin(this.value() as Credentials);
            if (res?.type === 'reset-pwd') {
                //todo: add handeler for reset password in login options
                const { reset_token } = res;
                this.resetPassword.emit({ reset_token: reset_token as string });
            } else this.success.emit(res);
        } catch (error) {
            const err = error?.msg ?? error?.message ?? error;
            if (err === 'INVALID_ATTEMPT') this.error = 'username-password-wrong';
            else if (err === 'TOO_MANY_LOGIN_ATTEMPTS') this.error = 'too-many-attempts';
            else if (err === 'CONNECTION_ERROR') this.error = 'connection-error';
            else this.error = error;
            console.error('login', error);
            this.fail.emit(this.error);
        } finally {
            this.loading.set(false);
        }
    }
}
