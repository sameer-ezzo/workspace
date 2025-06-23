import { ChangeDetectionStrategy, Component, forwardRef, input, SimpleChanges } from "@angular/core";

import { FormControl, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule, UntypedFormControl, UntypedFormGroup, Validators } from "@angular/forms";
import { MatFormFieldAppearance, MatFormFieldModule } from "@angular/material/form-field";
import { CommonModule } from "@angular/common";
import { MatInputModule } from "@angular/material/input";
import { MatSelectComponent } from "../select/select.component";
import { InputBaseComponent } from "@upupa/common";
import { ClientDataSource, DataAdapter } from "@upupa/data";
import { toObservable } from "@angular/core/rxjs-interop";

export type AccuracyLevel = "country" | "state" | "city" | "addressLine1" | "addressLine2" | "zipCode";

export type AddressModel = {
    country: string;
    zipCode: string;
    state: string;
    city: string;
    addressLine1: string;
    addressLine2: string;
};

@Component({
    selector: "mat-form-address-input",
    templateUrl: "./address.component.html",
    styleUrls: ["./address.component.scss"],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MatAddressComponent),
            multi: true,
        },
    ],
    imports: [FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, CommonModule, MatSelectComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatAddressComponent extends InputBaseComponent<AddressModel> {
    appearance = input<MatFormFieldAppearance>("outline");

    label = input("Address");

    display = input("native_name");
    readonly = input(false);

    defaultAddressComponents = {
        country: new UntypedFormControl(""),
        zipCode: new UntypedFormControl(""),
        state: new UntypedFormControl(""),
        city: new UntypedFormControl(""),
        addressLine1: new UntypedFormControl(""),
        addressLine2: new UntypedFormControl(""),
    };
    addressFormGroup = new UntypedFormGroup(this.defaultAddressComponents);

    // private _accuracy: AccuracyLevel;
    // @Input()
    // public get accuracy(): AccuracyLevel {
    //     return this._accuracy;
    // }
    // levels = ['country', 'state', 'city', 'addressLine1', 'addressLine2', 'zipCode']
    // public set accuracy(v: AccuracyLevel) {
    //     this._accuracy = v;

    //     const idx = this.levels.findIndex(l => l === v) + 1
    //     const acs = this.levels.slice(0, idx)
    //     const components = { ...this.defaultAddressComponents }

    //     Object.keys(components).forEach(k => {
    //         if (!acs.includes(k)) delete components[k]
    //     })

    //     this.addressFormGroup = new UntypedFormGroup(components)
    // }

    getControl(name: string): FormControl {
        return this.addressFormGroup.get(name) as FormControl;
    }

    countries = {};
    countryAdapter = new DataAdapter(new ClientDataSource(Object.values(this.countries)), "alpha_2", "native_name", undefined, undefined, {
        terms: [
            { field: "native_name", type: "like" },
            { field: "alpha_2", type: "like" },
            { field: "name", type: "like" },
        ],
    });
    private readonly _value$ = toObservable(this.value);
    constructor() {
        super();
        this._value$.subscribe((v) => {
            if (v != this.addressFormGroup.value) {
                for (const ctrlName in this.addressFormGroup.controls) {
                    if (Object.prototype.hasOwnProperty.call(this.addressFormGroup.controls, ctrlName)) {
                        const ctrl = this.addressFormGroup.controls[ctrlName];
                        ctrl.setValue(v?.[ctrlName] ?? "", {
                            emitEvent: false,
                        });
                    }
                }
            }
        });
    }

    ngOnInit(): void {
        this.addressFormGroup.valueChanges.subscribe((v) => {
            if (v !== this.value) {
                this.value.set(v);
                this.markAsTouched();
                this.propagateChange();
            }
        });
    }

    override async ngOnChanges(changes: SimpleChanges): Promise<void> {
        await super.ngOnChanges(changes);
        if (changes["required"]) {
            if (this.required()) this.addressFormGroup.setValidators([Validators.required]);
        }
        if (changes["required"] || changes["disabled"]) {
            const isDisabled = this.disabled() || this.readonly();
            if (isDisabled) {
                this.addressFormGroup.disable({ emitEvent: false });
            } else {
                this.addressFormGroup.enable({ emitEvent: false });
            }
        }
    }

    onSubmit(x) {}

    //validate
    // override validate(control?: AbstractControl): ValidationErrors {
    //     let error = null;
    //     if (this.required() && this.value()) {
    //         if (
    //             this.value().addressLine1 &&
    //             this.value().city &&
    //             this.value().state &&
    //             this.value().country &&
    //             this.value().zipCode
    //         )
    //             error = null;
    //         else error = { required: true };
    //     }
    //     return error;
    // }
}
