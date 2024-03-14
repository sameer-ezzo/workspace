import { COMMA, ENTER } from '@angular/cdk/keycodes'
import { Component, DestroyRef, ElementRef, EventEmitter, forwardRef, inject, Input, Output, signal, SimpleChanges, ViewChild } from '@angular/core'
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms'
import { MatAutocomplete, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete'
import { MatChipInputEvent } from '@angular/material/chips'
import { EventBus } from '@upupa/common'
import { NormalizedItem } from '@upupa/data'
import { catchError, combineLatest, debounceTime, firstValueFrom, map, Observable, of, take, timeout } from 'rxjs'
import { SelectComponent } from '../select/select.component'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
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
    @ViewChild('filterInput') filterInput: ElementRef<HTMLInputElement>

    @Input() visible = true
    @Input() selectable = true
    @Input() removable = true
    @Input() override separatorKeysCodes: number[] = [ENTER, COMMA]


    @Output() adding = new EventEmitter<{ chipKey: string, update: (chip: NormalizedItem) => void }>()


    options = signal<NormalizedItem[]>([])

    private readonly destroyRef = inject(DestroyRef)
    constructor(protected readonly _bus: EventBus) {
        super(_bus)
    }

    override async ngOnChanges(changes: SimpleChanges): Promise<void> {
        await super.ngOnChanges(changes)

        if (changes['adapter']) {
            combineLatest([this.valueDataSource$, this.adapter.normalized$])
                .pipe(
                    takeUntilDestroyed(this.destroyRef),
                    debounceTime(200),
                    map(([vs, ns]) => {
                        if (vs?.length > 0) return ns.filter(n => !vs.find(v => v?.key === n?.key))
                        else return ns
                    })).subscribe(x => this.options.set(x))
        }

    }

    isInValue(key: string) {
        const v = Array.isArray(this.valueDataSource) ? this.valueDataSource : [this.valueDataSource]
        return v.find(x => x?.key === key) != null
    }

    protected _select(item: NormalizedItem<any>) {
        this.select(item.key)
        this.value = [...(this.value ?? []).slice(), item.key]
        this._clearFilter()
    }

    protected _clearFilter() {
        this.q = this.filterInput.nativeElement.value = ''
    }

    getErrorMessage(error: KeyValue<unknown, unknown>) {
        const [key, value] = Object.entries(error)[0]
        return this.errorMessages[key] ?? key
    }

    handeled = false
    async selectionChange(e: MatAutocompleteSelectedEvent): Promise<void> {
        if (e.option.value === null && this.filterInput.nativeElement.value.length > 0) {
            await this.onAdding(this.filterInput.nativeElement.value)
        }

        setTimeout(() => { this.handeled = false }, 50)
        this.handeled = true

        const item = e.option.value as NormalizedItem<any>


        this.select(item.key)
        this.value = [...(this.value ?? []).slice(), item.key]
        this._clearFilter()
        this.control.markAsDirty()
        this.control.markAllAsTouched()
    }


    remove(item: NormalizedItem): void {
        const v = this.valueDataSource as any[]
        const idx = v.findIndex(v => v.key === item.key)
        if (idx > -1) {
            this.value.splice(idx, 1)
            this.value = this.value.slice()
            this.control.markAsDirty()
            this.control.markAllAsTouched()
        }
    }



    async onAdding(value: string): Promise<void> {
        const chip = value
        if (this.isInValue(chip)) return
        this.adding.emit({
            chipKey: chip, update: (chip) => {
                this.value = [...(this.value ?? []).slice(), chip.key]
                this._clearFilter()
                this.control.markAsDirty()
            }
        })
    }
}