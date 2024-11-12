import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, forwardRef, inject, input, output, signal, viewChild } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatAutocomplete } from '@angular/material/autocomplete';
import { EventBus } from '@upupa/common';
import { NormalizedItem } from '@upupa/data';
import { SelectComponent } from '../select/select.component';

@Component({
    selector: 'form-chips-input',
    templateUrl: './chips-input.component.html',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => ChipsComponent),
            multi: true,
        }
    ],
})
export class ChipsComponent extends SelectComponent {
    matAutocomplete = viewChild.required<MatAutocomplete>('auto');

    visible = input(true);
    selectable = input(true);
    removable = input(true);
    canAdd = input(false);
    separatorKeysCodes = input([ENTER, COMMA]);

    adding = output<string>();
    options = signal<NormalizedItem[]>([]);

    protected readonly _bus = inject(EventBus);

    protected _select(item: NormalizedItem<any>) {
        this.select(item.key);
        this.value.set([...(this.value() ?? []).slice(), item.value]);
        this._clearFilter();
    }

    protected _clearFilter() {
        this.filterModel.set('');
        this.filterInputRef().nativeElement.value = '';
    }

    async selectionChange(v: string): Promise<void> {
        if (v === null && this.filterInputRef().nativeElement.value.length > 0) {
            return this.onAdding(this.filterInputRef().nativeElement.value);
        }

        const values = await this.adapter().getItems([v]);
        const item = values?.[0];
        if (!item) return;
        this._select(item);

        this.markAsTouched();
        this.propagateChange();
    }

    remove(item: NormalizedItem): void {
        this.value.set(this.value().filter((v) => v.key === item.key));
        this.markAsTouched();
        this.propagateChange();
    }

    async onAdding(value: string) {
        if (!(value || '').length) return;

        const chip = value;
        this.selectionChange(value);

        let c = (await this.adapter().getItems([chip]))?.[0];
        if (c) return;

        if (!this.canAdd()) return;
        this.adding.emit(chip);
    }
}
