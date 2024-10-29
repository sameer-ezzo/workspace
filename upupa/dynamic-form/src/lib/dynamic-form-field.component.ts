import { Component, forwardRef, inject, input, computed, model, ComponentRef } from '@angular/core';
import { NG_VALUE_ACCESSOR, UntypedFormGroup, ControlValueAccessor, NG_VALIDATORS, Validator, AbstractControl, ValidationErrors, FormControl } from '@angular/forms';
import { PortalComponent, DynamicComponent } from '@upupa/common';
import { DynamicFormNativeThemeModule } from '@upupa/dynamic-form-native-theme';
import { DynamicFormInputsMapService } from './dynamic-form-inputsMap.service';
import { IFieldInputResolver } from './ifield-input.resolver';
import { Field } from './types';

@Component({
    standalone: true,
    selector: 'dynamic-form-field',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => DynamicFormFieldComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => DynamicFormFieldComponent),
            multi: true,
        },
    ],
    imports: [PortalComponent, DynamicFormNativeThemeModule],
    template: `
        @if (field().text) {
        <paragraph [class.hidden]="field().ui?.hidden === true" [text]="field().text" [renderer]="field().ui?.inputs?.['renderer'] || 'markdown'"></paragraph>
        }
        <!-- <ng-container *ngComponentOutlet="template().component; inputs: template().inputs" [formControlName]="field().name" [formGroup]="form()"> </ng-container> -->
        <portal [component]="template().component" [class]="template().class" [inputs]="template().inputs" [outputs]="template().outputs" (attached)="onAttached($event)"> </portal>
    `,

    host: {
        '[id]': 'id()',
        '[class]': 'classList()',
    },
})
export class DynamicFormFieldComponent implements ControlValueAccessor, Validator {
    private readonly inputsMapService = inject(DynamicFormInputsMapService);
    field = input.required<Field>();
    control = input.required<UntypedFormGroup>();

    template = input.required<DynamicComponent | null, DynamicComponent>({
        transform: (v) => {
            if (!v) {
                console.log('no template provided', this.field());
                return null;
            }
            let inputs = { ...(v.inputs ?? {}) };
            const inputsMap = this.inputsMapService.inputsMap;
            const inputNames = Object.keys(inputs);

            inputNames.forEach(async (name) => {
                const inputResolver = inputsMap[name] as IFieldInputResolver;
                if (inputResolver) {
                    inputs = await inputResolver.resolve(inputs);
                }
            });

            v.inputs = inputs;
            return v;
        },
    });

    id = computed(() => this.field().ui?.id || this.field().name);
    classList = computed(() => {
        const field = this.field();
        const template = this.template();
        return [this.id() + '-container', `${field.name}-input`, 'ff-container', template?.class, field.ui.class, field.ui?.hidden === true ? 'hidden' : '']
            .filter((c) => c)
            .join(' ')
            .trim();
    });

    writeValue(obj: any): void {
        this.childValueAccessor?.writeValue(obj);
    }

    validate(control: AbstractControl): ValidationErrors | null {
        // const validator = control.validator;
        // return validator(control);

        return null;
    }
    private _onValidatorChange: () => void;
    registerOnValidatorChange?(fn: () => void): void {
        this._onValidatorChange = fn;
    }

    private _onChange: (value: any) => void;
    registerOnChange(fn: (value: any) => void): void {
        this._onChange = fn;
        this.childValueAccessor?.registerOnChange(this._onChange);
    }
    private _onTouched: () => void;
    registerOnTouched(fn: () => void): void {
        this._onTouched = fn;
        this.childValueAccessor?.registerOnTouched(this._onTouched);
    }

    isDisabled = model(false);
    setDisabledState?(isDisabled: boolean): void {
        this.isDisabled.set(isDisabled);
        this.childValueAccessor?.setDisabledState?.(isDisabled);
    }

    childValueAccessor?: ControlValueAccessor;
    onAttached({ componentRef }: { componentRef: ComponentRef<any> }) {
        this.childValueAccessor = componentRef.instance as ControlValueAccessor;
        const validatorInstance = componentRef.instance as Validator;

        validatorInstance.validate = (control: AbstractControl) => {
            return control.errors;
        };
        validatorInstance.registerOnValidatorChange?.(this._onValidatorChange);
        //replay calls to value accessor
        this.childValueAccessor.registerOnChange(this._onChange);
        this.childValueAccessor.registerOnTouched(this._onTouched);

        this.childValueAccessor.writeValue(this.control().value);
        this.childValueAccessor.setDisabledState?.(this.isDisabled());
    }
}
