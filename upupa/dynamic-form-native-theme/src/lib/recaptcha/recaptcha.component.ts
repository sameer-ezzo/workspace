import { Component, Input, forwardRef, AfterViewInit, EventEmitter, Output, Directive, ElementRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, UntypedFormControl } from '@angular/forms';
import { ReplaySubject } from 'rxjs';


@Component({ standalone: true,
    selector: 'form-recaptcha-field',
    templateUrl: './recaptcha.component.html',
    styleUrls: ['./recaptcha.component.css'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => RecaptchaComponent),
            multi: true,
        }

    ]
})
export class RecaptchaComponent implements ControlValueAccessor, AfterViewInit {
    ngAfterViewInit(): void {


        const grecaptcha = window['grecaptcha'];
        if (!grecaptcha) throw `Google Recapatcha Script is not loaded! Make sure you have the following block copied within you html doc head <script src="https://www.google.com/recaptcha/api.js" async defer></script>`;

        try {
            grecaptcha.render('html_element', {
                sitekey: this.key,
                size: 'invisible',
                callback: token => {
                    this.value = token;
                    this.control?.setErrors(null);
                    this.propagateChange();
                },
                'expired-callback': () => {
                    this.value = null;
                    this.propagateChange();
                    this.control?.setErrors({ 'recapatcha-expired': 'expired' });
                },
                'error-callback': (err) => {
                    this.value = null;
                    this.propagateChange();
                    this.control?.setErrors({ 'recapatcha-error': err });
                }

            });
        } catch (err) {
            console.error(err)
        }
    }

    inlineError = true;


    @Input() key: string;

    propagateChange() {
        const value = this._value;
        if (this._onChange) this._onChange(value); //ngModel/ngControl notify (value accessor)
        if (this.control) this.control.setValue(value); //control notify
        this.valueChange.emit(value); //value event binding notify
        this.value$.next(value); //template reference #component.value$ | async
    };

    @Input() control: UntypedFormControl = new UntypedFormControl();
    @Output() valueChange = new EventEmitter<any | any[]>();
    value$ = new ReplaySubject<string>(1);

    _value: string;
    @Input()
    public get value(): string { return this._value; }
    public set value(v: string) {
        if (v === this._value) return;
        this._value = v;
        //this._updateViewModel();
    }

    //ControlValueAccessor
    _onChange: ((value: any | any[]) => void);
    _onTouch: (() => void);

    writeValue(value: string): void { this.value = value; }
    onTouch() { this.control.markAsTouched(); if (this._onTouch) this._onTouch(); };
    registerOnChange(fn: (value: string) => void): void { this._onChange = fn; }
    registerOnTouched(fn: () => void): void { this._onTouch = fn; }
    setDisabledState?(isDisabled: boolean): void {
        if (isDisabled && this.control.enabled) this.control.disable();
        else if (isDisabled === false && this.control.disabled) this.control.enable();
    }
}


@Directive({ selector: 'button[recaptcha]' })
export class RecaptchaDirective {
    @Input('recaptcha-key') key: string;

    @Output() recaptcha = new EventEmitter();

    constructor(public host: ElementRef<HTMLElement>) { }


    ngAfterViewInit(): void {
        const grecaptcha = window['grecaptcha'];
        if (!grecaptcha) throw `Google Recapatcha Script is not loaded! Make sure you have the following block copied within you html doc head <script src="https://www.google.com/recaptcha/api.js" async defer></script>`;
        grecaptcha.render(this.host.nativeElement, {
            sitekey: this.key,
            size: 'invisible',
            callback: token => {
                this.recaptcha.emit(token);
            },
            'expired-callback': () => {

            },
            'error-callback': (err) => {

            }

        });
    }




}