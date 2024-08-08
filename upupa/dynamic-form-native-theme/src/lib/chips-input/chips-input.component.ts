import { COMMA, ENTER } from '@angular/cdk/keycodes'
import { Component, EventEmitter, forwardRef, inject, Input, Output, signal, ViewChild } from '@angular/core'
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms'
import { MatAutocomplete } from '@angular/material/autocomplete'
import { EventBus } from '@upupa/common'
import { NormalizedItem } from '@upupa/data'
import { SelectComponent } from '../select/select.component'
import { KeyValue } from '@angular/common'


@Component({
    selector: 'form-chips-input',
    templateUrl: './chips-input.component.html',
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ChipsComponent), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => ChipsComponent), multi: true }
    ]
})
export class ChipsComponent extends SelectComponent {

    @ViewChild('auto') matAutocomplete: MatAutocomplete

    @Input() visible = true
    @Input() selectable = true
    @Input() removable = true
    @Input() canAdd = false
    @Input() separatorKeysCodes: number[] = [ENTER, COMMA]

    @Output() adding = new EventEmitter<string>()
    options = signal<NormalizedItem[]>([])


    protected readonly _bus = inject(EventBus)



    protected _select(item: NormalizedItem<any>) {
        this.select(item.key)
        this.value = [...(this.value ?? []).slice(), item.value]
        this._clearFilter()
    }

    protected _clearFilter() {
        this.q = this.filterInput.nativeElement.value = ''
    }

    getErrorMessage(error: KeyValue<unknown, unknown>) {
        const [key, value] = Object.entries(error)[0]
        return this.errorMessages[key] ?? key
    }


    async selectionChange(v: string): Promise<void> {
        this.control.markAllAsTouched()
        this.control.markAsDirty()

        if (v === null && this.filterInput.nativeElement.value.length > 0) {
            return this.onAdding(this.filterInput.nativeElement.value)
        }

        const values = await this.adapter.getItems([v])
        const item = values?.[0]
        if (!item) return
        this._select(item)
    }


    remove(item: NormalizedItem): void {
        this.value = this.value.filter(v => v.key === item.key)
        this.control.markAllAsTouched()
        this.control.markAsDirty()
    }



    async onAdding(value: string) {
        if (!(value || '').length) return

        const chip = value
        this.selectionChange(value)

        let c = (await this.adapter.getItems([chip]))?.[0]
        if (c) return

        if (!this.canAdd) return
        this.adding.emit(chip)
    }
}