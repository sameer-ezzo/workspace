import { Component, forwardRef, ElementRef, input, viewChild, model } from "@angular/core";
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from "@angular/forms";
import { fromEvent, merge, Subscription } from "rxjs";
import { InputDefaults } from "../defaults";
import { PhoneNumberFormat, PhoneNumberUtil } from "google-libphonenumber";
import { countries, FilterService, InputBaseComponent } from "@upupa/common";
import { takeWhile, tap } from "rxjs/operators";
import * as libphonenumber from "google-libphonenumber";
import { FloatLabelType, MatFormFieldAppearance } from "@angular/material/form-field";
export type PhoneNumber = {
    raw: string;
    number: string;
    code: string;
    countryCode: number;
    isValid: boolean;
};

@Component({
    selector: "form-phone-field",
    templateUrl: "./phone.component.html",
    styleUrls: ["./phone.component.scss"],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => PhoneInputComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => PhoneInputComponent),
            multi: true,
        },
    ],
})
export class PhoneInputComponent extends InputBaseComponent {
    inlineError = true;

    numberInput = viewChild<ElementRef>("input");
    appearance = input<MatFormFieldAppearance>(InputDefaults.appearance);
    floatLabel = input<FloatLabelType>(InputDefaults.floatLabel);
    placeholder = input("(xxx) xxx xx xx");

    type = input("phone");
    label = input("");
    hint = input("");
    readonly = input(false);

    countriesService = new FilterService(countries, ["name", "name", "phone_code"]);

    private phoneNumberUtil: PhoneNumberUtil = PhoneNumberUtil.getInstance();

    //TODO
    // override _updateViewModel() {
    //     if (this.value) {
    //         const res = this._getNumber(this.value());
    //         if (!res) return;
    //         if (res.formatted) {
    //             this.number.set(res.number);
    //             this.country = this.countriesService.all.find((x) => x.phone_code === `${res.code}`);
    //         }

    //         this.country = this.countriesService.all?.[0];
    //     }
    // }

    filterClick(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    number = model<string>("");

    private _getNumber(value: string): PhoneNumber & { formatted: string } {
        if (value?.length === 0) return null;
        let ph_no: libphonenumber.PhoneNumber;
        try {
            ph_no = this.phoneNumberUtil.parseAndKeepRawInput(value, this.country.phone_code.toUpperCase());
        } catch (e) {
            // this.control().setErrors({ 'invalid-no': true });
            return null;
        }

        const isValidNo = this.phoneNumberUtil.isValidNumber(ph_no);

        if (!isValidNo) {
            // this.control().setErrors({ 'invalid-no': true });

            return {
                raw: ph_no.getRawInput(),
                countryCode: ph_no.getCountryCode(),
                isValid: this.phoneNumberUtil.isValidNumber(ph_no),
                formatted: this.phoneNumberUtil.format(ph_no, PhoneNumberFormat.E164),
                code: `${ph_no.getCountryCode()}`,
                number: ph_no.getNationalNumberOrDefault().toString(),
            };
        } else {
            // this.control().setErrors(null);

            return {
                raw: ph_no.getRawInput(),
                countryCode: ph_no.getCountryCode(),
                isValid: this.phoneNumberUtil.isValidNumber(ph_no),
                formatted: this.phoneNumberUtil.format(ph_no, PhoneNumberFormat.E164),
                code: `${ph_no.getCountryCode()}`,
                number: ph_no.getNationalNumberOrDefault().toString(),
            };
        }
    }

    onNumberInputChange(event, _value: string) {
        if (!this.numberInput()) return;
        this.number.set(this.numberInput().nativeElement.value.trim());

        _value = _value.startsWith("+") ? _value : this.country?.phone_code ? `+${this.country.phone_code}${_value}` : _value;

        if (this.number().length < 3) return this.handleUserInput(_value);
        try {
            const r = this._getNumber(_value);
            this.handleUserInput(r.formatted);
        } catch (error) {}
    }

    private _country: any = this.countriesService.all[0];
    public get country(): any {
        return this._country;
    }
    public set country(v: any) {
        this._country = v;
        // this.onNumberInputChange(this.number());
    }

    showCodes = false;
    id = `${Math.random()}`.substring(2);
    filterCountries(f: string) {
        this.countriesService.filter = f;
    }

    onOverlayClick($event) {
        if ($event.target.id === this.id) {
            $event.preventDefault();
            $event.stopPropagation();
            this.toggleCodes(false);
        }
    }

    setPosition() {
        const triger = document.getElementById("codes-trigger");
        const rec = triger.getBoundingClientRect();
        const panel = document.getElementById(this.id);
        const box = panel.querySelector(`#box`) as HTMLDivElement;
        box.style.top = `${rec.top + rec.height + 10}px`;
        box.style.left = `${rec.left}px`;

        panel.style.display = "inline-block";
    }

    sub: Subscription;
    private readonly scroll$ = fromEvent(window, "scroll");
    private readonly resize$ = fromEvent(window, "resize");
    reposition$ = merge(this.scroll$, this.resize$).pipe(
        takeWhile(() => this.showCodes === true),
        tap(() => this.setPosition()),
    );

    toggleCodes(f: boolean = undefined) {
        this.showCodes = f != undefined ? f : !this.showCodes;
        if (this.showCodes === true) {
            this.setPosition();
            this.sub = this.reposition$.subscribe(() => {});

            setTimeout(() => document.getElementById(`${this.id}-input`)?.focus(), 250);
        } else {
            if (this.sub) this.sub.unsubscribe();
            document.getElementById(this.id).style.display = "none";
        }
    }

    enterOnFilter(event) {
        if (this.countriesService.filtered?.length > 0) this.country = this.countriesService.filtered[0];
        this.toggleCodes(false);
    }

    filter_arrowup(event) {}
    filter_arrowdown(event) {}
}
