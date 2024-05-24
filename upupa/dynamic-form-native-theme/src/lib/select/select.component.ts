import { Component, Input, forwardRef, Output, EventEmitter, TemplateRef, ViewChild, ElementRef, SimpleChanges, signal } from '@angular/core'
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms'
import { MatSelect } from '@angular/material/select'
import { ActionDescriptor, EventBus } from '@upupa/common'
import { DataComponentBase } from '@upupa/table'
import { ClientDataSource, NormalizedItem } from '@upupa/data'

import { BehaviorSubject, combineLatest, debounceTime, firstValueFrom, map, Subscription, switchMap, takeUntil, tap } from 'rxjs'
import { InputDefaults } from '../defaults'

@Component({
    selector: 'form-select',
    templateUrl: './select.component.html',
    styles: [``],
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SelectComponent), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => SelectComponent), multi: true }
    ]
})
export class SelectComponent<T = any> extends DataComponentBase<T> {
    inlineError = true
    showSearch = false

    @Input() required = true
    @Input() appearance = InputDefaults.appearance
    @Input() floatLabel = InputDefaults.floatLabel
    @Input() label: string
    @Input() panelClass: string
    @Input() placeholder: string
    @Input() hint: string
    @Input() errorMessages: Record<string, string> = {}
    @Input() valueTemplate: TemplateRef<any>
    @Input() itemTemplate: TemplateRef<any>
    _onlySelected = false

    @ViewChild('filterInput') filterInput: ElementRef<HTMLInputElement>
    constructor(protected readonly bus: EventBus) { super() }

    viewDataSource$ = new BehaviorSubject<'adapter' | 'value'>('value')

    items$ = this.viewDataSource$.pipe(
        switchMap(view => view === 'adapter' ?
            this.adapter.normalized$ :
            this.valueDataSource$)
    )


    singleSelected = signal(null)
    override async _updateViewModel(): Promise<void> {
        await super._updateViewModel()
        this.selected = this.valueDataSource.map(v => v.key)
        if (this.value !== undefined && !Array.isArray(this.value)) this.singleSelected.set(this.selected?.[0])
    }

    override async ngOnChanges(changes: SimpleChanges): Promise<void> {

        await super.ngOnChanges(changes)
        if (changes['adapter']) {
            this.items$ = this.viewDataSource$.pipe(
                switchMap(view => view === 'adapter' ?
                    this.adapter.normalized$ :
                    this.valueDataSource$)
            )
            this.firstLoaded = false
            this.showSearch = this.adapter.options?.terms?.length > 0

            if (this.adapter.dataSource instanceof ClientDataSource) {
                this.viewDataSource$.next('adapter')
            }
            await firstValueFrom(this.adapter.data$)
            this.firstLoaded = true
        }

    }



    keyDown(e: KeyboardEvent, input?: { open: () => void, panelOpen: boolean }) {
        if (!input || input.panelOpen === true) return
        const shouldOpen = e.key === 'ArrowDown' || e.key.length === 1 && /[a-z0-9 ]/i.test(e.key)
        if (shouldOpen) this.openedChange(true)
    }


    isPanelOpened = false
    paginatorSubscription: Subscription
    @ViewChild('selectInput') selectInput: MatSelect



    removeScrollPaginator(selectInput: MatSelect) {
        this.paginatorSubscription?.unsubscribe()
        this.paginatorSubscription = null
    }

    firstLoaded = false
    async openedChange(open: boolean, input?: { open: () => void }) {
        this.isPanelOpened = open
        if (!this.firstLoaded && open) {
            await this.loadData()
            setTimeout(() => { input?.open() }, 250);
        }
        // if (open) this.setScrollPaginator(selectInput)
        // else this.removeScrollPaginator(selectInput)
    }

    async loadData() {
        this.refreshData()
        this.viewDataSource$.next('adapter')
        await firstValueFrom(this.adapter.normalized$)
    }

    async valueChanged(key: Partial<T> | Partial<T>[]) {
        const getValueForKey = (all: NormalizedItem[], key: string) => (all.find(a => a.key === key)?.value)

        if (!key) this.value = undefined
        else {
            const all = this.valueDataSource.concat(this.adapter?.normalized || [])
            if (Array.isArray(key)) this.value = key.map(k => getValueForKey(all, k as unknown as string))
            else this.value = getValueForKey(all, key as unknown as string)
        }
        this.control.markAsDirty()
    }
    findKeyInValue(key: string) {
        return this.valueDataSource.find(v => v.key === key)
    }

    inputChange(target: EventTarget) {
        this.q = (target as HTMLInputElement).value as string
    }


    // openedChange(event) {
    //   if (event) {
    //     if (this.adapter.normalized.length < 5) this.vScrollHeight = this.adapter.normalized.length * 42
    //     else this.vScrollHeight = this.vScrollHeight = 5 * 42
    //     this.cdkVirtualScrollViewPort.setRenderedRange({ start: 0, end: this.cdkVirtualScrollViewPort.getRenderedRange().end + 1 })
    //     this.scrollToSelectedIndex()
    //     this.cdkVirtualScrollViewPort.checkViewportSize()
    //   } else {
    //     this.filter$.next('')
    //   }

    // }


    @Output() action = new EventEmitter<ActionDescriptor>()
    @Input() actions: ActionDescriptor[] = []
    onAction(event: any, action: ActionDescriptor) {
        event.stopPropagation()
        this.action.emit(action)
        this.bus.emit(action.action, { msg: action.action }, this) //select-{name}-{action}
    }

}