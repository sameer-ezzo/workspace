import { Component, EventEmitter, Input, Output, SimpleChanges, ViewChild } from '@angular/core'
import { PageEvent } from '@angular/material/paginator'
import { Sort } from '@angular/material/sort'
import { Subscription, BehaviorSubject, Subject } from 'rxjs'
import { debounceTime, distinctUntilChanged, map, startWith, takeUntil } from 'rxjs/operators'
import { ENTER } from '@angular/cdk/keycodes'
import { DataAdapter, FilterDescriptor, NormalizedItem } from '@upupa/data'
import { CdkDragDrop } from '@angular/cdk/drag-drop'
import { MatTable } from '@angular/material/table'
import { SelectionModel } from '@angular/cdk/collections'
import { InputBaseComponent } from '@upupa/common'
import { FormControl } from '@angular/forms'


export class Logger {
    static log(title: string, style: { background: string, color: string }, ...terms: any[]) {
        console.log(`%c ${title}`, `background: ${style?.background} color: ${style.color}`, ...terms)
    }
}




@Component({
    selector: 'data-base',
    template: '',
    styles: []
})
export class DataComponentBase<T = any> extends InputBaseComponent<Partial<T> | Partial<T>[]> {


    readonly separatorKeysCodes: number[] = [ENTER]
    loading$ = new BehaviorSubject(false)
    public get loading() {
        return this.loading$.value
    }
    public set loading(value) {
        this.loading$.next(value)
    }

    firstLoad$ = new BehaviorSubject(false)
    public get firstLoad() {
        return this.firstLoad$.value
    }
    public set firstLoad(value) {
        this.firstLoad$.next(value)
    }

    @Input() filterControl = new FormControl('')
    @Input() noDataImage: string
    @Input('add-url') addUrl: string
    @Input('show-add') showAdd: boolean
    @Output() add = new EventEmitter<any>()

    @Input() minAllowed: number
    @Input() maxAllowed = 1

    private _adapter!: DataAdapter<T>
    @Input() adapter: DataAdapter<T>
    normalized$sub: Subscription
    q$ = new BehaviorSubject<string>(null)

    private _q = ''
    @Input()
    get q() { return this._q }
    set q(value: string) {
        this.q$.next(value)
    }

    filter$ = new Subject<string>()


    @Input() focusedItem: NormalizedItem<T>
    @Output() focusedItemChange = new EventEmitter<NormalizedItem<T>>()
    @Output() itemClick = new EventEmitter<NormalizedItem<T>>()



    @Input() filterdebounceTime = 200

    ngOnInit() {
        this.q$.pipe(startWith(''),
            debounceTime(+this.filterdebounceTime),
            takeUntil(this.destroy$)
        ).subscribe(x => this.filter$.next(x))

        this.filter$.pipe(
            distinctUntilChanged(),
            takeUntil(this.destroy$)
        ).subscribe(x => this.onFilter(x))
    }


    refreshData() {
        this.loading = true
        this.adapter?.refresh()
    }

    override async ngOnChanges(changes: SimpleChanges) {
        if (this.adapter) {
            if (!changes['adapter']?.firstChange && this._adapter !== this.adapter) {
                this._adapter = this.adapter
                Logger.log("DATA ADAPTER : changed!", { background: 'black', color: 'orange' }, this.name, this.adapter)
            }

            this.normalized$sub?.unsubscribe()
            this.normalized$sub = this.adapter?.normalized$.subscribe(data => this.onDataChange(data))
            this._updateViewModel() //force update view model every time adapter changes to calculate the value data source
        }
        if (changes['maxAllowed']) this.maxAllowed = +this.maxAllowed
        if (changes['minAllowed']) this.minAllowed = +this.minAllowed
        if (changes['control'] && this.control) {
            this.value = this.control?.value //read value from control (but why not write value to control?)
            this.control?.registerOnChange(value => this.value = value)
        }
    }

    dataChangeListeners: ((data: NormalizedItem<T>[]) => void)[] = []
    onDataChange(data: NormalizedItem<T>[]) {
        if (this.firstLoad)
            setTimeout(() => this.firstLoad = false, 1000) //delay this to give time to html template to switch

        this.loading = false

        this.dataChangeListeners.forEach(x => x(data))
    }

    destroy$ = new Subject<void>()
    ngOnDestroy() {
        this.normalized$sub?.unsubscribe()
        this.destroy$.next()
        this.destroy$.complete()
    }



    // eslint-disable-next-line @typescript-eslint/member-ordering
    @Output() pageChange = new EventEmitter<PageEvent>()
    onPageChange(page: PageEvent) {
        this.loading = true
        this.adapter.page = page
        this.pageChange.emit(page)
    }

    // eslint-disable-next-line @typescript-eslint/member-ordering
    @Output() sortChange = new EventEmitter<Sort>()
    onSortData(sort: Sort) {
        this.loading = true
        this.adapter.sort = sort
        this.sortChange.emit(sort)
    }

    // eslint-disable-next-line @typescript-eslint/member-ordering
    @Output() filterChange = new EventEmitter<FilterDescriptor>()
    onFilter(q: string) {
        if (this.q === q || (this._q === '' && !q)) return
        this.loading = true
        this._q = q
        const f = { ...this.adapter.filter, ...(this.adapter.normalizeFilter(q) || {}) }
        this.adapter.filter = f
        this.filterChange.emit(f)
    }

    //todo grouping https://docs.mongodb.com/manual/reference/operator/aggregation/group/
    isGroup(row: any): boolean { return row.group }


    // eslint-disable-next-line @typescript-eslint/member-ordering
    @ViewChild(MatTable) table: MatTable<T>

    // eslint-disable-next-line @typescript-eslint/member-ordering
    @Output() rowDropped = new EventEmitter()
    drop(event: CdkDragDrop<any[]>) {
        this.table.renderRows()
        this.rowDropped.emit({ event, from: event.previousIndex, to: event.currentIndex })

        // const prevIndex = this.adapter.normalized.findIndex((d) => d === e.event.item.data)
        // moveItemInArray(this.adapter.normalized, prevIndex, e.event.currentIndex)
    }
    onAdd() { this.add.emit() }


    selectAllToggled(e) {
        if (e.checked !== null || e.checked !== undefined) {
            this.toggleSelectAll()
        }
    }

    //selection
    selectionModel = new SelectionModel<(string | number | symbol)>(true, [], true)
    toggleSelectAll() {
        //selection can have items from data from other pages or filtered data so:
        //if selected items n from this adapter data < adapter data -> select the rest
        //else unselect all items from adapter data only

        const _selected = this.adapter.normalized.filter(s => this.selectionModel.isSelected(s.key))
        if (this.adapter.normalized.length === _selected.length) this.selectionModel.deselect(...(_selected.map(s => s.key)))
        else this.selectionModel.select(...this.adapter.normalized.map(n => n.key))
    }


    select(key: keyof T) {

        this.selectionModel.select(key)
        this._selected = this.selectionModel.selected
    }

    deselect(key: keyof T) {
        this.selectionModel.deselect(key)
        this._selected = this.selectionModel.selected
    }
    toggle(key: keyof T) {
        // const _key = this.adapter.getItems(key) .extract(value, this.adapter.keyProperty, value).key ?? value
        if (this.selectionModel.isSelected(key)) this.deselect(key)
        else this.select(key)
    }

    setFocusedItem(row) {
        this.focusedItem = row
        this.focusedItemChange.emit(this.focusedItem)
    }
    nextFocusedItem() {

        const i = this.focusedItem ? this.adapter.normalized.indexOf(this.focusedItem) : -1
        this.focusedItem = this.adapter.normalized[i + 1]
        this.focusedItemChange.emit(this.focusedItem)
    }
    prevFocusedItem() {
        const i = this.focusedItem ? this.adapter.normalized.indexOf(this.focusedItem) : this.adapter.normalized.length
        this.focusedItem = this.adapter.normalized[i - 1]
        this.focusedItemChange.emit(this.focusedItem)
    }

    onLongPress(row: NormalizedItem<T>) {
        this.focusedItem = row
        this.selectionModel.toggle(row.key)
        this.longPressed = row //to notify click about it
    }
    longPressed: NormalizedItem<T>
    onClick(row: NormalizedItem<T>) {
        this.focusedItem = row
        this.focusedItemChange.emit(this.focusedItem)

        if (this.longPressed) this.select(row.key)
        else {
            if (this.selectionModel.selected.length > 0) this.selectionModel.toggle(row.key)
            else this.itemClick.emit(this.focusedItem)
        }

        this.longPressed = null //clear long press notification
    }



    _selected: any | any[]
    get selected() {
        return this._selected//this.selectionModel.selected.map(value => this.adapter.normalized.find(n => n.value === value))
    }
    set selected(n: any | any[]) {

        this.selectionModel.clear()
        this._selected = n
        if (!n) return
        if (Array.isArray(n)) {
            this.selectionModel.select(...this._selected as any[])
        }
        else {
            if (this._selected) this.selectionModel.select(this._selected as any)
        }
    }


    //todo: HOT FIX
    //selection model only for key prop
    //value is valueDataSource.map(v=>v.value)

    private readonly _valueDataSource$ = new BehaviorSubject<NormalizedItem<T> | NormalizedItem<T>[]>([])

    public get valueDataSource(): NormalizedItem<T> | NormalizedItem<T>[] {
        return this._valueDataSource$.value;
    }
    public set valueDataSource(v: NormalizedItem<T> | NormalizedItem<T>[]) {
        if (Array.isArray(v)) this._valueDataSource$.next(v)
        else this._valueDataSource$.next(v?.[0])
    }

    valueDataSource$ = this._valueDataSource$.pipe(map(v => {
        if (Array.isArray(this._value)) return v
        else return v?.[0]
    }))
    override async _updateViewModel() {
        const value = this._value
        if (value) {
            if (this.adapter) {
                const keys = this.adapter.getKeysFromValue(value)
                const v = await this.adapter.getItems(keys) ?? []
                this._valueDataSource$.next(v)
            }
        }
        else this._valueDataSource$.next([])
    }


}
