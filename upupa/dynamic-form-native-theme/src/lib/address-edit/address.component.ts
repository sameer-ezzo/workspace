/* eslint-disable @angular-eslint/component-selector */
import { Component, Input, SimpleChanges, forwardRef } from '@angular/core';

import { NG_VALUE_ACCESSOR, NG_VALIDATORS, Validator, AbstractControl, ValidationErrors, UntypedFormGroup, UntypedFormControl, Validators, FormControl } from '@angular/forms';
import { countries, InputBaseComponent } from '@upupa/common';
import { ClientDataSource, DataAdapter } from '@upupa/data';

export type AccuracyLevel = 'country' | 'state' | 'city' | 'addressLine1' | 'addressLine2' | 'zipCode'

export type AddressModel = {
    country: string,
    zipCode: string,
    state: string,
    city: string,
    addressLine1: string,
    addressLine2: string
}

@Component({
    selector: 'address-edit',
    templateUrl: './address.component.html',
    styleUrls: ['./address.component.scss'],
    providers: [
        { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => AddressComponent), multi: true },
        { provide: NG_VALIDATORS, useExisting: forwardRef(() => AddressComponent), multi: true }
    ]
})
export class AddressComponent extends InputBaseComponent<AddressModel> implements Validator {

    @Input() label = 'Address';


    @Input() required = true;
    @Input() disabled = false;

    @Input() display = 'native_name';
    @Input() readonly = false;
    @Input() errorMessages: { [errorCode: string]: string } = {};

    defaultAddressComponents = {
        country: new UntypedFormControl(''),
        zipCode: new UntypedFormControl(''),
        state: new UntypedFormControl(''),
        city: new UntypedFormControl(''),
        addressLine1: new UntypedFormControl(''),
        addressLine2: new UntypedFormControl('')
    }
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
        return this.addressFormGroup.get(name) as FormControl
    }

    countryAdapter = new DataAdapter(new ClientDataSource(Object.values(countries)), 'alpha_2', 'native_name', undefined, undefined, {
        terms: [
            { field: 'native_name', type: 'like' },
            { field: 'alpha_2', type: 'like' },
            { field: 'name', type: 'like' }
        ]
    })

    ngOnInit(): void {
        this.value1$.subscribe(v => {
            if (v != this.addressFormGroup.value) {
                for (const ctrlName in this.addressFormGroup.controls) {
                    if (Object.prototype.hasOwnProperty.call(this.addressFormGroup.controls, ctrlName)) {
                        const ctrl = this.addressFormGroup.controls[ctrlName];
                        ctrl.setValue(v?.[ctrlName] ?? '', { emitEvent: false })
                    }
                }
            }
        })

        this.addressFormGroup.valueChanges.subscribe(v => {
            if (v != this.value) {
                this._value = v;
                this.control.markAsDirty()

            }
        })
    }

    override ngOnChanges(changes: SimpleChanges): void {
        super.ngOnChanges(changes)



        if (changes['required']) {
            this.required = (<any>this.required) === 'true' || (<any>this.required) === '' || this.required === true;
            if (this.required) this.addressFormGroup.setValidators([Validators.required])
        }
        if (this.readonly === true) {
            this.addressFormGroup.disable()
        } else this.addressFormGroup.enable()


    }

    onSubmit(x) { }


    //validate
    override validate(control?: AbstractControl): ValidationErrors {
        let error = null;
        if (this.required && this.value) {
            if (this.value.addressLine1 && this.value.city && this.value.state && this.value.country && this.value.zipCode) error = null;
            else error = { required: true }
        }
        return error;
    }
}