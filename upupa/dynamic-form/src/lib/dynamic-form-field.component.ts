import { Component, forwardRef, inject, input, computed, model, ComponentRef, SimpleChanges, signal } from '@angular/core';
import { NG_VALUE_ACCESSOR, UntypedFormGroup, ControlValueAccessor, Validator, AbstractControl } from '@angular/forms';
import { PortalComponent, DynamicComponent } from '@upupa/common';
import { DynamicFormNativeThemeModule } from '@upupa/dynamic-form-native-theme';
import { FieldItem } from './types';
import { DynamicFormService } from './dynamic-form.service';
import { AdapterInputResolverService } from './adapter-input-resolver.service';

@Component({
    standalone: true,
    selector: 'dynamic-form-field',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => DynamicFormFieldComponent),
            multi: true,
        },
    ],
    imports: [PortalComponent, DynamicFormNativeThemeModule],
    template: `
        @if (field().text) {
        <paragraph [class.hidden]="field().ui?.hidden === true" [text]="field().text" [renderer]="field().ui?.inputs?.['renderer'] || 'markdown'"></paragraph>
        } @if(template()) {
        <portal [component]="template().component" [class]="template().class" [inputs]="template().inputs" [outputs]="template().outputs" (attached)="onAttached($event)"> </portal>
        }@else{
        <div class="error">Template not found for {{ field().name }}</div>
        }
    `,

    host: {
        '[id]': 'id()',
        '[class]': 'classList()',
    },
})
export class DynamicFormFieldComponent implements ControlValueAccessor {
    formService = inject(DynamicFormService);

    field = input.required<FieldItem>();
    control = input.required<UntypedFormGroup>();

    id = computed(() => this.field().ui?.id || this.field().name);
    classList = computed(() => {
        const field = this.field();
        const template = this.template();
        return [this.id() + '-container', `${field.name}-input`, 'ff-container', template?.class, field.ui?.class, field.ui?.hidden === true ? 'hidden' : '']
            .filter((c) => c)
            .join(' ')
            .trim();
    });

    template = signal<DynamicComponent>(undefined);
    theme = input('material');

    private readonly adapterResolver = inject(AdapterInputResolverService);
    async ngOnChanges(changes: SimpleChanges) {
        if (changes['field']) {
            const field = this.field();
            let inputs = { ...(field.ui?.inputs ?? {}) };
            await this.adapterResolver.resolve(inputs);
            this.template.set({
                component: this.formService.getControl(field.input, this.theme()).component,
                inputs: inputs,
                outputs: field.ui?.outputs,
                class: field.ui?.class,
            });
        }
    }
    writeValue(obj: any): void {
        this.childValueAccessor?.writeValue(obj);
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
