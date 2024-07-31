import { Component, OnInit, Input, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { AuthService } from '@upupa/auth';
import {  FilterService, countries } from '@upupa/common';
import { DataService } from '@upupa/data';
import { Subscription } from 'rxjs';
import { UntypedFormControl, NgModel } from '@angular/forms';
import { SnackBarService } from '@upupa/dialog';


@Component({
    selector: 'change-phone',
    templateUrl: './change-phone.component.html'
})
export class ChangePhoneComponent {
    @Input() appearance = 'fill';
    @Input() name = 'phone';

    countriesService = new FilterService(countries, ["name", "name", "phone_code"]);

    phoneControl = new UntypedFormControl()
    user: any;
    __phone = '';
    _phone = '';
    get phone(): string { return this._phone; }
    set phone(val: string) {
        if (val?.startsWith('+')) {
            this._phone = val;
            this.__phone = val.substring(1);
        } else {
            this._phone = '+' + val;
            this.__phone = val;
        }
    }

    readonly = true;
    sub: Subscription;
    changed = new EventEmitter<boolean>();

    constructor(public data: DataService, public auth: AuthService, public snack: SnackBarService) { }
    ngOnInit() {
        this.sub = this.auth.user$.subscribe(async u => {
            if (u) {
                this.user = u;
                this.phone = u.phone;
            }
        })
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['phone']) {
            if (this.readonly === false) this.phone = changes['phone'].previousValue;
        }

    }

    ngOnDestroy() { if (this.sub) this.sub.unsubscribe(); }
    async changePhone() {
        try {
            await this.data.patch(`/user/${this.user.sub}`, [{ op: "replace", path: "/phone", value: this.phone }]);
            this.snack.openSuccess();
            await this.auth.refresh();
            this.changed.emit(true);
            this.readonly = true;
        } catch (error) {
            if (error.status === 500) {
                const e = error.error;
                if (e.message.indexOf("duplicate key") > -1) {
                    this.snack.openFailed('duplicate-phone');
                    this.phoneControl?.setErrors({ 'duplicate-phone': true })
                }
            } else {
                this.snack.openFailed('not-saved');
                console.error(error);
            }
        }
    }
}