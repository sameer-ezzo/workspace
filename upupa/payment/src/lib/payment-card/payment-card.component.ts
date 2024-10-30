import { Component, Input, SimpleChanges, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

@Component({
    selector: 'payment-card',
    templateUrl: './payment-card.component.html',
    styleUrls: ['./payment-card.component.css'],
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PaymentCardComponent), multi: true }],
})
export class PaymentCardComponent implements ControlValueAccessor {
    numberDisplayed: string;

    private _number: string;

    @Input()
    get number() {
        return this._number;
    }
    set number(value: string) {
        value = value || '';
        this._number = value.replace(/[\s|-]/gm, '');
        this.onNumberChange();
    }

    @Input() holder: string;
    @Input() type: string;
    @Input() month: number;
    @Input() year: number;
    @Input() code: string;
    @Input() required = false;

    bank: IBankInfo;
    thisYear: number;

    constructor() {
        this.thisYear = new Date().getFullYear() - 2000;
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['number']) {
            this.numberDisplayed = this.number;
            this.onNumberChange();
        }
        if (changes['required']) {
            this.required = <any>this.required === 'true' || <any>this.required === '' || this.required === true;
        }
    }

    onNumberChange() {
        if (this.number) {
            // this.bank = new Bank(this.number)
            if (this.bank) this.type = this.bank.type;
        } else this.bank = null;
    }

    triggerChange() {
        if (this.onChange) {
            const value = this.validateCard() ? { type: this.type, holder: this.holder, number: this.number, year: this.year, month: this.month, code: this.code } : null;
            this.onChange(value);
        }
    }
    triggerTouch() {
        if (this.onTouch) this.onTouch();
    }

    validateCard(): boolean {
        const today = new Date();
        const thisYear = today.getFullYear() - 2000;
        const thisMonth = today.getMonth() + 1;
        return (
            this.holder &&
            this.number?.length >= 14 &&
            this.number?.length <= 19 &&
            this.code?.length === 3 &&
            this.month <= 12 &&
            ((this.year === thisYear && this.month > thisMonth) || (this.year > thisYear && this.year <= thisYear + 10))
        );
    }

    //implement
    writeValue(card: ICard): void {
        this.year = card && card.year ? card.year : null;
        this.month = card && card.month ? card.month : null;
        this.code = card && card.code ? card.code : null;
        this.number = card && card.number;
        this.holder = card && card.holder;
        this.type = card && card.type;
        this.triggerChange();
    }
    onChange: (card: ICard) => void;
    registerOnChange(onChange: (card: ICard) => void): void {
        this.onChange = onChange;
    }
    onTouch: () => void;
    registerOnTouched(onTouch: () => void): void {
        this.onTouch = onTouch;
    }
    disabled: boolean;
    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }
}

export interface ICard {
    holder: string;
    type: string;
    number: string;
    month: number;
    year: number;
    code: string;
}
export interface IBankInfo {
    type: string;
    name: string;
    country: string;
    localTitle: string;
    engTitle: string;
    url: string;
    color: string;
    prefixes: string;
    code: string;
}
