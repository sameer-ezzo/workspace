import { Component, Input, EventEmitter, SimpleChanges, Output } from '@angular/core'
import { AuthService } from '@upupa/auth'
import { SnackBarService } from '@upupa/common'
import { DataService } from '@upupa/data'
import { Subscription, takeWhile } from 'rxjs'
import { UntypedFormControl } from '@angular/forms'
import { emailField, Field, textField } from '@upupa/dynamic-form'
import { languageDir, LanguageService } from '@upupa/language'
import { MatInputComponent } from '@upupa/dynamic-form-material-theme'


@Component({
    selector: 'change-user-prop',
    templateUrl: './change-user-prop.component.html'
})
export class ChangeUserPropComponent<T = any> extends MatInputComponent {

    @Input('prop') propToBeChanged: 'phone' | 'email' | 'name' = 'name'


    editing = false
    sub: Subscription
    @Output() changed = new EventEmitter<{ oldValue: T, newValue: T }>()
    user: any
    dir: 'ltr' | 'rtl' = 'rtl'

    fileds: any
    formData: { [key: string]: any }

    constructor(public data: DataService, private ls: LanguageService, public auth: AuthService, public snack: SnackBarService) {
        super()
    }

    ngOnInit() {
        this.sub = this.auth.user$
            .pipe(takeWhile(x => this.editing === false))
            .subscribe(u => {
                if (u) {
                    this.user = u
                    this.formData = { [this.propToBeChanged]: u[this.propToBeChanged] }
                }
            })
    }

    override ngOnChanges(changes: SimpleChanges) {
        super.ngOnChanges(changes)
        this._generateFields(this.propToBeChanged)

    }
    valueChanged(v: any) {
        this._value = v[this.propToBeChanged]
    }

    revert() {
        this._value = this.user[this.propToBeChanged]
    }
    private _generateFields(propToBeChanged: string) {
        if (!this.propToBeChanged) throw new Error("Property to be changed should be provided.")

        this.dir = 'ltr'
        switch (this.propToBeChanged) {
            case 'email':
                this.fileds = { [this.propToBeChanged]: emailField(this.propToBeChanged, this.label, this.placeholder, this.hint, this.appearance) }
                break
            case 'phone': this.fileds = {
                [this.propToBeChanged]: {
                    type: 'field', input: 'phone', name: this.propToBeChanged, ui: {
                        inputs: { appearance: this.appearance, label: this.label, placeholder: this.placeholder }
                    }
                } as Field
            }
                break
            case 'name':
                this.dir = languageDir(this.ls.language)
                this.fileds = { [this.propToBeChanged]: textField(this.propToBeChanged, this.label, this.placeholder, this.hint, this.appearance, [{ name: 'latin' }]) }
                break
        }
    }

    ngOnDestroy() { if (this.sub) this.sub.unsubscribe() }
    async changeProp() {
        try {
            const e = { oldValue: this.user[this.propToBeChanged], newValue: this.value }
            await this.data.patch(`/user/${this.user.sub}`, [{ op: "replace", path: "/" + this.propToBeChanged, value: this.value }])
            await this.auth.refresh()
            this.value = this.user[this.propToBeChanged]

            this.changed.emit(e)
        } catch (error) {
            if (error.status === 500) {
                const e = error.error
                if (e.message.indexOf("duplicate key") > -1) {
                    this.snack.openFailed('duplicate-phone')
                    this.control?.setErrors({ 'duplicate-phone': true })
                }
            } else {
                this.snack.openFailed('not-saved')
                console.error(error)
            }
        }
        finally {
            this.readonly = true
        }
    }
}