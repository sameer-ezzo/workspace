import { Component, Input, Output, EventEmitter, ViewChild, forwardRef, ViewEncapsulation, OnDestroy, AfterViewInit, TemplateRef, inject } from "@angular/core";
import { currencies } from "../currencies";
import { PaymentService } from "../payment.service";
import { NG_VALUE_ACCESSOR, ControlValueAccessor, NgForm, ValidationErrors } from "@angular/forms";
import { Subscription } from "rxjs";
import { MatStepper } from "@angular/material/stepper";
import { TranslateService } from "@upupa/language";
import { SnackBarService } from "@upupa/dialog";
import { DynamicFormCommands, DynamicFormEvents, FormScheme } from "@upupa/dynamic-form";
import { ClientDataSource, DataAdapter } from "@upupa/data";
import { Condition } from "@noah-ark/expression-engine";
import { DOCUMENT } from "@angular/common";

const strgKey = "pref_paymentM";

@Component({ standalone: true,
    selector: "payment-method",
    templateUrl: "./payment-method.component.html",
    styleUrls: ["./payment-method.component.scss"],
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PaymentMethodComponent), multi: true }],
    encapsulation: ViewEncapsulation.None,
})
export class PaymentMethodComponent implements ControlValueAccessor, OnDestroy, AfterViewInit {
    @ViewChild("skrillIcon") skrill: TemplateRef<any>;
    @ViewChild("netellerIcon") neteller: TemplateRef<any>;
    @ViewChild("paypalIcon") paypal: TemplateRef<any>;
    @ViewChild("bankTransferIcon") bankTransfer: TemplateRef<any>;
    @ViewChild("masterCardIcon") masterCard: TemplateRef<any>;
    @ViewChild("visaCardIcon") visaCard: TemplateRef<any>;
    @ViewChild("paymentCardIcon") paymentCard: TemplateRef<any>;
    @ViewChild("paymentCardIcon") card: TemplateRef<any>;
    @ViewChild("localTransferIcon") localTransfer: TemplateRef<any>;

    subs: Subscription[] = [];
    model: any = {};
    @ViewChild("stepper") stepper: MatStepper;

    amountCurrencyNotDefined = true;
    addressEditor = false;

    //form
    @Input() disabled: boolean;
    @Input() appearance: "fill" | "outline" = "outline";
    @ViewChild("detailsForm") detailsForm: NgForm;
    @ViewChild("mainForm") mainForm: NgForm;

    //main
    @Input() type = "transferin";
    @Output("pay") payEvent = new EventEmitter<any>();

    //additional steps
    @Input() steps: any[] = [];

    //amount
    @Input()
    get amount(): number {
        return this.model?.amount;
    }
    set amount(value: number) {
        if (!this.model) this.model = {};
        this.model.amount = value;
        this.amountChange.emit(this.amount);
        this.triggerChange();
    }
    @Output() amountChange = new EventEmitter<number>();
    @Input("min-amount") minAmount: number;
    @Input("max-amount") maxAmount: number;
    @Input("min-amount-method") minAmountMethod: { [method: string]: number } = {};
    @Input("max-amount-method") maxAmountMethod: { [method: string]: number } = {};
    @Input() customAmount = false;

    @Input() currencies = currencies; //supported currencies
    @Input()
    get currency(): string {
        return this.model?.currency;
    }
    set currency(value: string) {
        if (!this.model) this.model = {};
        this.model.currency = value;
        this.currencyChange.emit(this.currency);
        this.triggerChange();
    }
    @Output() currencyChange = new EventEmitter<string>();
    @Input() customCurrency = false;

    //method
    @Input() methods = []; //avilable payment options
    @Input()
    get method(): string {
        return this.model?.method;
    }
    set method(value: string) {
        if (!this.model) this.model = {};
        this.model.method = value;
        this.model.paymentInfo = {};
        this.methodChange.emit(this.method);
        this.triggerChange();
    }
    @Output() methodChange = new EventEmitter<string>();

    //custom per method
    @Input() banks;
    @Input() addresses = [];

    @Input() transfers = [];

    constructor(public paymentService: PaymentService, public translator: TranslateService, public snack: SnackBarService) {}

    ngOnChanges(changes) {
        if (changes["amount"]) this.amount = parseFloat(this.amount + "");
        if (changes["customAmount"]) this.customAmount = <any>this.customAmount === "true" || <any>this.customAmount === "" || this.customAmount === true;
        if (changes["customCurrency"]) this.customCurrency = <any>this.customCurrency === "true" || <any>this.customCurrency === "" || this.customCurrency === true;

        if (changes["banks"] && this.model.method === "bank") this.model.paymentInfo = {};
        if (changes["method"]) this.model.paymentInfo = {};

        //reset currency if no in currencies list
        if (changes["currencies"] || changes["currency"]) {
            if (!this.currencies || this.currencies.find((c) => c.code === this.currency) === undefined) this.currency = null;
        }

        //make sure amount & currency are set
        this.amountCurrencyNotDefined = (this.amount === null && !this.customAmount) || (this.currency === null && !this.customCurrency);
    }

    ngOnDestroy() {
        this.subs.forEach((s) => s.unsubscribe());
    }

    ngAfterViewInit(): void {
        const sub1 = this.detailsForm.valueChanges.subscribe(() => {
            this.triggerChange();
        });
        const sub2 = this.mainForm.valueChanges.subscribe(() => {
            this.triggerChange();
        });

        this.subs.push(sub1);
        this.subs.push(sub2);

        setTimeout(() => {
            if (this.methods?.length === 1) this.selectMethod(this.methods[0], 0);
        }, 200);
    }

    async pay() {
        this.payEvent.emit(this.model);
        //await this.paymentService.pay(this.selectedMethod, this.amount, this.currency, this.model);
    }

    addAddress() {
        this.addressEditor = true;
        this.model.address = { ...this.model.address };
    }
    private readonly doc = inject(DOCUMENT);

    copyToClipboard(copyText: HTMLSpanElement) {
        var textArea = this.doc.createElement("textarea");
        textArea.value = copyText.textContent;
        this.doc.head.appendChild(textArea);
        textArea.select();
        this.doc.execCommand("Copy");
        textArea.remove();
    }

    triggerChange() {
        if (this.onChange) {
            this.onChange(this.model);
        }
    }

    writeValue(obj: any): void {
        this.model = obj;
        this.triggerChange();
    }
    onChange: (x: any) => void;
    registerOnChange(onChange: (x: any) => void): void {
        this.onChange = onChange;
    }
    onTouch: () => void;
    registerOnTouched(onTouch: () => void): void {
        this.onTouch = onTouch;
    }
    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    get valid() {
        return this.amount > 0 && this.currency != null && this.method != null && this.stepper.selectedIndex > 0;
    }

    validate(): ValidationErrors {
        let valid = true;
        let errors: any = {};
        if (this.amount === null) {
            valid = false;
            errors.amount = "MISSING_AMOUNT";
        }
        if (this.currency === null) {
            valid = false;
            errors.currency = "MISSINGN_CURRENCY";
        }
        if (this.method === null) {
            valid = false;
            errors.method = "MISSINGN_METHOD";
        }

        if (this.detailsForm.invalid) {
            valid = false;
            errors.method = "INVALID_DETAILS";
            const controls = this.detailsForm.controls;
            Object.keys(controls).forEach((k) => {
                const c = controls[k];
                if (c.invalid) errors[k] = c.errors;
            });
        }

        if (this.mainForm.invalid) {
            valid = false;
            errors.method = "INVALID_MAIN";
            const controls = this.mainForm.controls;
            Object.keys(controls).forEach((k) => {
                const c = controls[k];
                if (c.invalid) errors[k] = c.errors;
            });
        }

        return valid ? null : errors;
    }

    focusedMethod: string;
    methodIndex: number;
    selectMethod(method: any, i: number) {
        if (this.methodIndex === i) return;
        this.methodIndex = i;

        this.method = method.method;
        this.model.paymentInfo = {};
        this.focusedMethod = method.method;
        this.methodChange.emit(method);
        localStorage.setItem(strgKey, method);
    }

    localTransferRequest() {}

    crypto_networks = [
        { key: "BSC", value: "Binance BSC" },
        { key: "ETH", value: "Etherium" },
    ];
    crypto_networks_source = new ClientDataSource(this.crypto_networks);
    crypto_networks_adapter = new DataAdapter(this.crypto_networks_source, "key", "value", "key", null);

    crypto_currencies_bsc = [
        { key: "BUSD", value: "Binance USD" },
        { key: "USDC", value: "USDC" },
        { key: "USDT", value: "USD Tether" },
    ];
    crypto_currencies_eth = [
        { key: "USDC", value: "USDC" },
        { key: "USDT", value: "USD Tether" },
    ];

    cryptoForm: FormScheme = {
        network: { input: "select", inputs: { label: "Network", adapter: this.crypto_networks_adapter } },
        currency: { input: "select", inputs: { label: "Currency" } },
        sender: { input: "text", inputs: { label: "Sender" } },
        wallet: { input: "text", inputs: { label: "Wallet", readonly: true } },
    };

    wallets = {
        BSC_BUSD: "bsc_BUSD_0xe1200731Ba14bb72Ed",
        BSC_USDC: "bsc_USDC_0xe1200731Ba14bb72Ed",
        BSC_USDT: "bsc_USDT_0xe1200731Ba14bb72Ed",
        ETH_USDC: "eth_USDC_0xe1200731Ba14bb72Ed",
        ETH_USDT: "eth_USDT_0xe1200731Ba14bb72Ed",
    };

    cryptoConditions: Condition[] = [
        {
            on: DynamicFormEvents.valueChanged,
            when: (e) => e.payload.fields === "/network",
            do: [
                (e) => {
                    let currencies = [];
                    const value = e.payload.value;
                    switch (value) {
                        case "ETH":
                            currencies = this.crypto_currencies_eth;
                            break;
                        case "BSC":
                            currencies = this.crypto_currencies_bsc;
                            break;
                    }
                    return new DynamicFormCommands.ChangeInputs("currency", { adapter: new DataAdapter(new ClientDataSource(currencies), "key", "value") });
                },
            ],
        },
        {
            on: DynamicFormEvents.valueChanged,
            when: (e) => e.payload.fields === "/network" || e.payload.fields === "/currency",
            do: [
                (e) => {
                    const formValue = e.source.value;
                    if (formValue?.network && formValue?.currency) return new DynamicFormCommands.ChangeValue("wallet", this.wallets[`${formValue.network}_${formValue.currency}`]);
                },
            ],
        },
    ];
}
