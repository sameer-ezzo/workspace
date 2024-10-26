import {
    Component,
    EventEmitter,
    Input,
    OnChanges,
    Output,
    SimpleChanges,
    computed,
    effect,
    forwardRef,
    input,
    model,
    output,
} from '@angular/core';
import {
    AbstractControl,
    ControlValueAccessor,
    FormControl,
    NG_VALIDATORS,
    UntypedFormControl,
    ValidationErrors,
    Validator,
    ValidatorFn,
} from '@angular/forms';
import { BehaviorSubject, merge } from 'rxjs';

@Component({
    selector: 'input-base',
    template: '',
})
export class InputBaseComponent<T = any> implements ControlValueAccessor {
    // value1$ = new BehaviorSubject<T>(undefined);

    name = input<string, string>('', {
        alias: 'fieldName',
        transform: (v) => {
            return v ? v : `field_${Date.now()}`;
        },
    });

    validators = input<{ validate: ValidatorFn }[]>([]);

    // control = input<FormControl>();
    errorMessages = model<{ [errorCode: string]: string }>(null);

    valueChange = output<T | T[]>();

    required = input<boolean>(false);
    disabled = model(false);

    value = model<T>(undefined);

    onInput(event: any, v: any) {
        // if (event && 'stopPropagation' in event && typeof event.stopPropagation === 'function')
        //     event.stopPropagation();
        this.value.set(v);
        this._propagateChange();
        this.markAsTouched();
    }

    //ControlValueAccessor
    _onChange: (value: T | T[]) => void;
    _onTouch: () => void;

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    _updateViewModel() {}

    _propagateChange() {
        if (this._onChange) this._onChange(this.value()); //ngModel/ngControl notify (value accessor)
        this.valueChange.emit(this.value()); //value event binding notify
    }

    writeValue(v: T): void {
        this.value.set(v);
    }

    markAsTouched() {
        if (this._onTouch) this._onTouch();
    }
    registerOnChange(fn: (value: T) => void): void {
        this._onChange = fn;
    }
    registerOnTouched(fn: () => void): void {
        this._onTouch = fn;
    }
    setDisabledState?(isDisabled: boolean): void {
        this.disabled.set(isDisabled);
    }
}

@Component({
    selector: 'input-base',
    template: `
        @if (label()) {
        <label>{{ label() }}</label>
        }
        <input
            #input
            [type]="type()"
            [value]="value() || ''"
            (input)="onInput($event, $event.target?.['value'])"
            (blur)="markAsTouched()"
            [readonly]="readonly()"
            [placeholder]="placeholder()"
            [required]="required()"
        />
        @for (error of errorMessages() | keyvalue; track error) {
        <span class="error">{{ error.key }}</span>
        }
    `,
})
export class BaseTextInputComponent<T = any> extends InputBaseComponent<T> {
    inlineError = true;

    placeholder = input('');
    type = input('text');
    label = input('');
    hint = input('');
    readonly = input(false);
}
