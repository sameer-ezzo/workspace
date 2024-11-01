import { WritableSignal } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { Fieldset, FieldItem } from './types';

export class FieldFormGroup extends FormGroup {
    path: `/${string}`;
    field: WritableSignal<Fieldset>;
    name: string;
    form: FormGroup;
}
export class FieldFormControl extends FormControl {
    path: `/${string}`;
    field: WritableSignal<FieldItem>;
    name: string;
    form: FormGroup;

    setVisibility(visible: boolean) {
        const f = this.field();
        f.ui ??= {};
        f.ui.hidden = !visible;
        this.field.set({ ...f });
    }
}
