import { Component, forwardRef, inject, input, computed, model, ComponentRef, SimpleChanges, signal } from '@angular/core';
import { NG_VALUE_ACCESSOR, UntypedFormGroup, ControlValueAccessor, Validator, AbstractControl, NG_VALIDATORS, ValidationErrors } from '@angular/forms';
import { PortalComponent, DynamicComponent } from '@upupa/common';
import { DynamicFormNativeThemeModule } from '@upupa/dynamic-form-native-theme';
import { FieldItem } from './types';
import { DynamicFormService } from './dynamic-form.service';
import { AdapterInputResolverService } from './adapter-input-resolver.service';

@Component({
    standalone: true,
    selector: 'field',
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
        @if (template()) {
            <portal [component]="template().component" [class]="template().class" [inputs]="template().inputs" [outputs]="template().outputs" (attached)="onAttached($event)">
            </portal>
        } @else {
            <div class="error">Template not found for {{ name() }}</div>
        }
    `,

    host: {
        '[class]': 'classList()',
    },
})
export class DynamicFormFieldComponent implements ControlValueAccessor, Validator {
    formService = inject(DynamicFormService);

    field = input.required<FieldItem>();
    control = input.required<UntypedFormGroup>();

    name = input.required<string>();
    classList = computed(() => {
        const field = this.field();
        const template = this.template();
        return [`${this.name()}-field`, `${field.input}-input`, 'field', template?.class, field.ui?.class, field.ui?.hidden === true ? 'hidden' : '']
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
        for (const childAccessor of this.childAccessors) {
            childAccessor.writeValue(obj);
        }
    }

    private _onChange: (value: any) => void;
    registerOnChange(fn: (value: any) => void): void {
        this._onChange = fn;
        for (const childAccessor of this.childAccessors) {
            childAccessor.registerOnChange(this._onChange);
        }
    }
    private _onTouched: () => void;
    registerOnTouched(fn: () => void): void {
        this._onTouched = fn;
        for (const childAccessor of this.childAccessors) {
            childAccessor.registerOnTouched(this._onTouched);
        }
    }

    isDisabled = model(false);
    setDisabledState?(isDisabled: boolean): void {
        this.isDisabled.set(isDisabled);
        for (const childAccessor of this.childAccessors) {
            childAccessor.setDisabledState?.(isDisabled);
        }
    }

    childAccessors: ControlValueAccessor[] = [];
    childValidators: Validator[] = [];

    onAttached({ componentRef }: { componentRef: ComponentRef<any> }) {
        this.childAccessors = componentRef.injector.get(NG_VALUE_ACCESSOR, [], { optional: true, self: true }) as ControlValueAccessor[];
        this.childValidators = componentRef.injector.get(NG_VALIDATORS, [], { optional: true, self: true }) as Validator[];

        for (const childValidator of this.childValidators) {
            childValidator.registerOnValidatorChange?.(this._onValidatorChange);
        }
        if (this.childValidators.length) this._onValidatorChange?.();

        //replay calls to value accessor
        for (const childAccessor of this.childAccessors) {
            childAccessor.registerOnChange(this._onChange);
            childAccessor.registerOnTouched(this._onTouched);

            childAccessor.writeValue(this.control().value);
            childAccessor.setDisabledState?.(this.isDisabled());
        }
    }

    validate(control: AbstractControl): ValidationErrors | null {
        let valid = true;
        let error: ValidationErrors = {};
        for (const childValidator of this.childValidators) {
            const result = childValidator.validate(control);
            if (result) {
                valid = false;
                error = { ...error, ...result };
            }
        }

        return valid ? null : error;
    }

    private _onValidatorChange: () => void;
    registerOnValidatorChange?(fn: () => void): void {
        this._onValidatorChange = fn;
        for (const childValidator of this.childValidators) {
            childValidator.registerOnValidatorChange?.(this._onValidatorChange);
        }
    }
}
