import { COMMA, ENTER } from '@angular/cdk/keycodes'
import { Component, ElementRef, EventEmitter, forwardRef, Input, Output, SimpleChanges, ViewChild } from '@angular/core'
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms'
import { MatAutocomplete, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete'
import { MatChipInputEvent } from '@angular/material/chips'
import { EventBus } from '@upupa/common'
import { NormalizedItem } from '@upupa/data'
import { catchError, combineLatest, debounceTime, firstValueFrom, map, Observable, of, take, timeout } from 'rxjs'
import { SelectComponent } from '../select/select.component'

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


    @Output() adding = new EventEmitter<string>()


    options$: Observable<NormalizedItem[]>

    constructor(private _bus: EventBus) {
        super(_bus)
    }

    override async ngOnChanges(changes: SimpleChanges): Promise<void> {
        await super.ngOnChanges(changes)

        if (changes['adapter']) {
            this.options$ = combineLatest([this.valueDataSource$, this.adapter.normalized$])
                .pipe(
                    debounceTime(200),
                    map(([vs, ns]) => {
                        if (vs?.length > 0) return ns.filter(n => !vs.find(v => v?.key === n?.key))
                        else return ns
                    }))
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

    private _clearFilter() {
        this.q = this.filterInput.nativeElement.value = ''
    }

    handeled = false
    selectionChange(e: MatAutocompleteSelectedEvent): void {
        if (!e.option.value) return

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



    async onAdding(e: MatChipInputEvent): Promise<void> {
        if (this.handeled === true) return
        const chip = e.value

        if (this.isInValue(chip)) return
        this.adding.emit(chip)
        this._bus.emit(getAddChipEventName(this.name), { chip }, this)

        const item = await firstValueFrom(
            this._bus.on(getAddChipEventName(this.name) + '_reply').pipe(
                take(1),
                map(x => x.payload.key),
                catchError(e => of(chip)),
                timeout({ each: 2000, with: () => of(chip) }))
        )

        this.value = [...(this.value ?? []).slice().filter(x => x !== chip), item]
        this._clearFilter()
        this.control.markAsDirty()

    }
}

export function getAddChipEventName(name: string) {
    const r = (name?.trim().length > 0 ? name + '_' : '') + 'add_chip'

    return r
}