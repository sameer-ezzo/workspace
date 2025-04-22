import { Component, forwardRef, inject, input, computed, model, ComponentRef } from "@angular/core";
import { NG_VALUE_ACCESSOR, ControlValueAccessor, Validator, AbstractControl, NG_VALIDATORS, ValidationErrors } from "@angular/forms";
import { PortalComponent } from "@upupa/common";
import { ParagraphComponent } from "@upupa/dynamic-form-material-theme";
import { DynamicFormService } from "./dynamic-form.service";
import { FieldRef } from "./field-ref";
import { ComponentType } from "@angular/cdk/portal";

@Component({
    selector: "field",
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
    imports: [PortalComponent, ParagraphComponent],
    template: `
        @if (fieldRef().text()) {
            <paragraph [text]="fieldRef().text()" [renderer]="textRenderer()"></paragraph>
        }
        @if (component()) {
            <portal [component]="component()" [class]="fieldRef().class()" [inputs]="fieldRef().inputs()" [outputs]="fieldRef().outputs()" (attached)="onAttached($event)">
            </portal>
        } @else {
            <div class="error">Template not found for {{ fieldRef().name }}</div>
        }
    `,
    host: {
        "[class]": "classList()",
    }
})
export class DynamicFormFieldComponent implements ControlValueAccessor, Validator {
    formService = inject(DynamicFormService);
    theme = input("material");

    fieldRef = input.required<FieldRef>();
    component = computed<ComponentType<any>>(() => this.formService.getControl(this.fieldRef().field.input, this.theme()).component);
    textRenderer = computed<any>(() => this.fieldRef().inputs()?.["renderer"]);
    classList = computed(() => {
        const fieldRef = this.fieldRef();
        const hidden = fieldRef.hidden() === true;
        return [`${fieldRef.name}-field`, "field", `${fieldRef.field.input}-input`, fieldRef.class(), hidden ? "hidden" : ""]
            .filter((c) => c)
            .join(" ")
            .trim();
    });

    writeValue(obj: any): void {
        for (const childAccessor of this.childAccessors) {
            childAccessor.writeValue?.(obj);
        }
    }

    private _onChange: (value: any) => void;
    registerOnChange(fn: (value: any) => void): void {
        this._onChange = fn;
        for (const childAccessor of this.childAccessors) {
            childAccessor.registerOnChange?.(this._onChange);
        }
    }
    private _onTouched: () => void;
    registerOnTouched(fn: () => void): void {
        this._onTouched = fn;
        for (const childAccessor of this.childAccessors) {
            childAccessor.registerOnTouched?.(this._onTouched);
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

        this.fieldRef().attachedComponentRef.set(componentRef);

        for (const childValidator of this.childValidators) {
            childValidator.registerOnValidatorChange?.(this._onValidatorChange);
        }

        //replay calls to value accessor
        for (const childAccessor of this.childAccessors) {
            childAccessor.registerOnChange(this._onChange);
            childAccessor.registerOnTouched(this._onTouched);

            childAccessor.writeValue(this.fieldRef().control.value);
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
