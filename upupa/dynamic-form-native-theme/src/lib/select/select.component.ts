import { Component, Input, forwardRef, Output, EventEmitter, TemplateRef, ViewChild, ElementRef, SimpleChanges } from '@angular/core'
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms'
import { MatSelect } from '@angular/material/select'
import { ActionDescriptor, EventBus } from '@upupa/common'
import { DataComponentBase } from '@upupa/table'
import { ClientDataSource, NormalizedItem } from '@upupa/data'

import { BehaviorSubject, debounceTime, firstValueFrom, map, Subscription, switchMap, takeUntil, tap } from 'rxjs'
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

    @Input() required = false
    @Input() appearance = InputDefaults.appearance
    @Input() floatLabel = InputDefaults.floatLabel
    @Input() label: string
    @Input() panelClass: string
    @Input() placeholder: string
    @Input() hint: string
    @Input() errorMessages = {}
    @Input() valueTemplate: TemplateRef<any>
    @Input() itemTemplate: TemplateRef<any>
    _onlySelected = false

    @ViewChild('search') searchInput: ElementRef<HTMLInputElement>
    constructor(private bus: EventBus) { super() }

    viewDataSource$ = new BehaviorSubject<'adapter' | 'value'>('value')
    items: NormalizedItem[]
    items$ = this.viewDataSource$.pipe(
        switchMap(view => view === 'adapter' ? this.adapter.normalized$ : this.valueDataSource$.pipe(map(v => {
            if (!v) return v
            return Array.isArray(v) ? v : [v]
        }))),
        tap(items => this.items = items))

    override ngOnInit(): void {
        super.ngOnInit()

        if (this.adapter?.dataSource instanceof ClientDataSource) this.viewDataSource$.next('adapter')
        this.adapter?.data$.pipe(takeUntil(this.destroy$)).subscribe(x => this.firstLoaded = true)


        this.valueDataSource$.subscribe(value => {
            if (!value) this.selected = null
            else if (Array.isArray(value)) {
                if (value.length === this.selected?.length) return
                const selected = this.selected ?? []
                const notSelected = value.filter(v => v && selected.every(s => s === v.key)).map(x => x.key)
                this.selected = [...selected, ...notSelected]
            } else {
                this.selected = value?.key
            }
        })
    }

    override async ngOnChanges(changes: SimpleChanges): Promise<void> {
        await super.ngOnChanges(changes)
        this.showSearch = this.adapter?.options?.terms?.length > 0
    }

    ngAfterViewInit(): void {
        if (this.searchInput && this.adapter)
            this.adapter.normalized$.pipe(takeUntil(this.destroy$), debounceTime(400))
                .subscribe(x => {
                    const q = this.searchInput.nativeElement.value ?? ''
                    this.searchInput.nativeElement.focus()
                    this.searchInput.nativeElement.setSelectionRange(q.length, q.length)
                })
    }


    onArrowDown(e, select) {
        if (select.panelOpen === true) return
        e.stopPropagation();
        this.openedChange(!select.panelOpen)
    }

    isPanelOpened = false
    paginatorSubscription: Subscription
    @ViewChild('selectInput') selectInput: MatSelect



    removeScrollPaginator(selectInput: MatSelect) {
        this.paginatorSubscription?.unsubscribe()
        this.paginatorSubscription = null
    }

    firstLoaded = false
    async openedChange(open: boolean) {

        this.isPanelOpened = open
        if (!this.firstLoaded && open) {
            this.refreshData()
            this.viewDataSource$.next('adapter')
            await firstValueFrom(this.adapter.normalized$)
            this.selectInput.open()
        }
        // if (open) this.setScrollPaginator(selectInput)
        // else this.removeScrollPaginator(selectInput)
    }

    async valueChanged(key: any | any[]) {
        const getV = (all, item) => (all.find(a => a?.key === item)?.value ?? item)

        if (!key) this.value = undefined
        else {
            const all = (Array.isArray(this.valueDataSource) ? this.valueDataSource : [this.valueDataSource]).concat(this.adapter.normalized)
            if (Array.isArray(key)) this.value = key.map(x => getV(all, x))
            else this.value = getV(all, key)
        }
        this.control.markAsDirty()
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
        this.bus.emit(action.name, { msg: action.name }, this) //select-{name}-{action}
    }

}