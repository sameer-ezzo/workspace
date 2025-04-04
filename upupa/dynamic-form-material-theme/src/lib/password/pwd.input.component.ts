import { Component, ElementRef, inject, input, model, signal } from "@angular/core";
import {
    AbstractControl,
    ControlValueAccessor,
    FormBuilder,
    FormControl,
    FormGroup,
    FormGroupDirective,
    FormsModule,
    NgControl,
    NgForm,
    ReactiveFormsModule,
    Validator,
} from "@angular/forms";
import { MatFormField, MatFormFieldControl } from "@angular/material/form-field";
import { PasswordStrength, verifyPassword } from "@upupa/auth";
import { Subject } from "rxjs";

class Password {
    constructor(
        public password: string,
        public confirm: string,
    ) {}
}

@Component({
    selector: "pwd-input",
    imports: [FormsModule, ReactiveFormsModule],
    providers: [{ provide: MatFormFieldControl, useExisting: PasswordInput }],
    template: `
        <input [attr.autocomplete]="autocomplete()" [placeholder]="placeholder()" [formControl]="control('password')" />
        <br />
        <input [attr.autocomplete]="autocomplete()" [placeholder]="placeholder()" [formControl]="control('confirm')" />
    `,
    styles: [
        `
            :host {
                display: block;
            }
            input {
                border: none;
                background: none;
                padding: 0;
                outline: none;
                font: inherit;
                width: 100%;
            }
        `,
    ],
    host: {
        "[attr.id]": "id",
        "[class]": "classList",
        role: "group",
        "[attr.aria-describedby]": "describedBy",
        "[attr.aria-labelledby]": "parentFormField?.getLabelId()",
    }
})
export class PasswordInput implements ControlValueAccessor {
    static nextId = 0;
    id = `password-input-${PasswordInput.nextId++}`;
    stateChanges = new Subject<void>();
    control = (name) => this.pwdGroup.get(name) as FormControl<string>;
    placeholder = input("Password");
    pwdGroup: FormGroup<{
        password: FormControl<string>;
        confirm: FormControl<string>;
    }> = inject(FormBuilder).group(
        {
            password: new FormControl<string>(""),
            confirm: new FormControl<string>(""),
        },
        { validators: this.passwordValidate.bind(this) },
    );
    value = model(new Password("", ""));
    autocomplete = input<"current-password" | "new-password">("new-password");
    required = input<boolean>(false);
    ngControl = inject(NgControl, { optional: true, host: true });
    private readonly _parentForm = inject(NgForm, { optional: true });
    private readonly _parentFormGroup = inject(FormGroupDirective, { optional: true });
    public parentFormField = inject(MatFormField, { optional: true });
    private readonly _elementRef = inject(ElementRef);

    showConfirmPasswordInput = input(true);
    showPassword = model(false);
    canGenerateRandomPassword = input(false);
    passwordStrength = input<PasswordStrength, PasswordStrength>(new PasswordStrength(), { transform: (v) => v ?? new PasswordStrength() });

    touched: boolean;
    constructor() {
        if (this.ngControl != null) {
            // Setting the value accessor directly (instead of using
            // the providers) to avoid running into a circular import.
            this.ngControl.valueAccessor = this;
        }
    }

    focused = false;

    get classList() {
        return this.focused ? "floating" : "";
    }

    ngOnDestroy() {
        this.stateChanges.complete();
    }

    _errorState = false;
    get errorState(): boolean {
        return this.pwdGroup.invalid && this.touched;
    }

    onFocusIn(event: FocusEvent) {
        if (!this.focused) {
            this.focused = true;
            this.stateChanges.next();
        }
    }

    onFocusOut(event: FocusEvent) {
        if (!this._elementRef.nativeElement.contains(event.relatedTarget as Element)) {
            this.touched = true;
            this.focused = false;
            this.onTouched();
            this.stateChanges.next();
        }
    }

    ngDoCheck() {
        if (this.ngControl) {
            this.updateErrorState();
        }
    }

    private updateErrorState() {
        const parentSubmitted = this._parentFormGroup?.submitted || this._parentForm?.submitted;
        const touchedOrParentSubmitted = this.touched || parentSubmitted;

        const newState = (this.ngControl?.invalid || this.pwdGroup.invalid) && touchedOrParentSubmitted;

        if (this.errorState !== newState) {
            this._errorState = newState;
            this.stateChanges.next(); // Notify listeners of state changes.
        }
    }

    userAriaDescribedBy = input<string>("", { alias: "aria-describedby" });
    get describedBy() {
        const ids: string[] = [];
        if (this.userAriaDescribedBy()) {
            ids.push(this.userAriaDescribedBy());
        }
        return ids.join(" ");
    }

    setDescribedByIds(ids: string[]) {
        const controlElement = this._elementRef.nativeElement;
        controlElement.setAttribute("aria-describedby", ids.join(" "));
    }

    onContainerClick(event: MouseEvent) {
        if ((event.target as Element).tagName.toLowerCase() == "input") return;
        const firstInput = this._elementRef.nativeElement.querySelector("input:first-child");
        if (firstInput) firstInput.focus();
    }

    writeValue(obj: Password): void {
        this.value.set(obj);
    }

    onChange: () => void;
    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    onTouched: () => void;
    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    disabled = signal(false);
    setDisabledState?(isDisabled: boolean): void {
        this.disabled.set(isDisabled);
    }

    passwordValidate(control: AbstractControl) {
        if (!this.pwdGroup) return null;
        const { password, confirm } = this.pwdGroup.value;

        if (password !== confirm) return { "Password and confirm password do not match": true };

        const strength = this.passwordStrength();
        if (!strength) return null;
        const validations = [];
        const result = verifyPassword(password);
        for (const k in strength) {
            const current = result[k];
            const required = strength[k];
            if (Array.isArray(required)) {
                if (required[0] > current)
                    validations.push({
                        message: "Password should have at least " + required[0] + " " + k,
                        current,
                        required: required[0],
                    });
                if (required[1] < current)
                    validations.push({
                        message: "Password should have at most " + required[1] + " " + k,
                        current,
                        required: required[1],
                    });
            } else if (required > current) validations.push({ message: "Password should have at least " + required + " " + k, current, required });
        }

        if (validations.length === 0) return null;
        const errors = validations
            .map((v) => ({
                [v.message]: { required: v.required, current: v.current },
            }))
            .reduce((v1, v2) => ({ ...v1, ...v2 }), {});

        return errors;
    }
}
