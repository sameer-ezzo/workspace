import { Component, EventEmitter, OnChanges, Input, Output, SimpleChanges, Type, ElementRef, forwardRef, ViewChild, ChangeDetectionStrategy, AfterViewInit, inject, ChangeDetectorRef, WritableSignal, signal, ViewContainerRef, ComponentRef, computed, HostBinding } from '@angular/core'
import { debounceTime, takeUntil } from 'rxjs/operators'

import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout'
import { MatDialog } from '@angular/material/dialog'
import { ColumnsSelectComponent } from './columns-select.component/columns-select.component'
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms'

import { NormalizedItem } from '@upupa/data'

import { ActionDescriptor, ActionEvent, DialogService, EventBus } from '@upupa/common'
import { MatCheckboxChange } from '@angular/material/checkbox'
import { ReplaySubject, firstValueFrom } from 'rxjs'
import { DataComponentBase } from './datacomponent-base.component'
import { animate, state, style, transition, trigger } from '@angular/animations'
import { SortHeaderArrowPosition } from '@angular/material/sort'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'

export type PipeDescriptor = { pipe: Type<any>, args: string[] }
export type PipesDescriptor = { [column: string]: PipeDescriptor | Type<any> }

export type ColumnDescriptor = {
    header?: string,
    width?: number,
    visible?: boolean,
    sticky?: 'start' | 'end'
    sortDisabled?: boolean,
    sortId?: string,
    sortArrowPosition?: SortHeaderArrowPosition,
    pipe?: PipeDescriptor | Type<any>
    component?: Type<any>
}
export type ColumnsDescriptor<T = any> = { [key in keyof T]: ColumnDescriptor | 1 | 0 }
type ColumnsDescriptorStrict = { [key: string]: ColumnDescriptor }

@Component({
    selector: 'data-table',
    templateUrl: './data-table.component.html',
    styleUrls: ['./data-table.component.scss'],
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DataTableComponent), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => DataTableComponent), multi: true }
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [
        trigger('detailExpand', [
            state('collapsed,void', style({ height: '0px', minHeight: '0' })),
            state('expanded', style({ height: '*' })),
            transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
        ]),
    ],
})
export class DataTableComponent<T = any> extends DataComponentBase<T> implements OnChanges, AfterViewInit {
    @HostBinding('attr.tabindex') tabindex = 0

    @Input() stickyHeader = false
    @Input() showSearch = undefined // will be set to true if there are terms in the adapter
    hasHeader = computed(() => {
        return this.showSearch === true || (this.label || '').length > 0 || this.headerActionsList().length > 0
    }) // will be set to true if showSearch is true or there are bulk actions or header actions

    @Input() label: string
    @Input() actions: ActionDescriptor[] | ((item: any) => ActionDescriptor[]) = [] // this represents the actions that will be shown in each row
    @Input() headerActions: ActionDescriptor[] | ((all: NormalizedItem<T>[], selected: NormalizedItem<T>[]) => ActionDescriptor[]) = [] // this represents the actions that will be shown in the header of the table
    @Input() dragDropDisabled = true

    @Input() rowClass: (item: NormalizedItem<T>) => string = (item) => item.key.toString()
    @Output() action = new EventEmitter<ActionEvent>()


    private _headerActions = signal<ActionDescriptor[]>([])

    headerMenuActions = computed(() => {
        const selected = this.selectedNormalized()
        const actions = (this._headerActions() ?? []).filter(a => ActionDescriptor._header(a) && ActionDescriptor._menu(a))
        return actions
    })

    headerActionsList = computed(() => {
        const selected = this.selectedNormalized()
        const actions = (this._headerActions() ?? []).filter(a => ActionDescriptor._header(a) && !ActionDescriptor._menu(a))
        return actions
    })

    @Input() pageSizeOptions = [10, 25, 50, 100]


    _properties: ColumnsDescriptorStrict = {} //only data columns
    _columns: string[] = []
    @Input() columns: string[] | ColumnsDescriptor | 'auto' = 'auto' //eventually columns are the container of all and it's a dictionary
    @Input() templates: any = {}


    expanded: { [key: string]: WritableSignal<boolean> } = {}
    @Input() expandable: 'single' | 'multi' | 'none' = 'none'
    @Input() expandableTemplate: any = null
    toggleExpand(row, index) {
        if (!this.expanded[row.key]) this.expanded[row.key] = signal(false)
        const v = this.expanded[row.key]?.()
        this.expanded[row.key].set(!v)
    }

    @Input() cellTemplate: any
    @ViewChild('defaultTemplate') defaultTemplate: any

    readonly _allowChangeColumnsOptions = signal(false)
    @Input()
    public get allowChangeColumnsOptions() {
        return this._allowChangeColumnsOptions()
    }
    public set allowChangeColumnsOptions(value) {
        this._allowChangeColumnsOptions.set(value)
    }

    // _updateViewModel(): Promise<void> {
    //     this.selected = this.value
    // }

    constructor(protected host: ElementRef<HTMLElement>,
        private bus: EventBus,
        protected breakpointObserver: BreakpointObserver, protected dialog: DialogService) {
        super()
        this.maxAllowed = Infinity
    }


    handset: boolean
    @Output() selectionChange = new EventEmitter<NormalizedItem<T>[]>()
    selectedNormalized = signal<NormalizedItem<T>[]>([])
    override ngOnInit() {
        super.ngOnInit()

        this.dataChangeListeners.push(data => { if (this.columns === 'auto') this.generateColumns() })

        this.breakpointObserver.observe([Breakpoints.Handset]).pipe(takeUntil(this.destroy$))
            .subscribe(result => { this.handset = result.matches })

        this.selectionModel.changed.pipe(
            takeUntilDestroyed(this.destroyRef),
            debounceTime(this.filterDebounceTime))
            .subscribe(x => {
                const normalized = x.source.selected.map(s => this.adapter.normalized.find(n => n.key === s))
                this.selectedNormalized.set(normalized)
                this.selectionChange.emit(normalized)
            })
    }



    ngAfterViewInit(): void {
        if (!this.cellTemplate) this.cellTemplate = this.defaultTemplate
    }

    override async ngOnChanges(changes: SimpleChanges) {
        await super.ngOnChanges(changes)
        if (changes['showSearch']) {
            this.showSearch = changes['showSearch'].currentValue === true
        }
        if (changes['adapter'] && this.showSearch === undefined) {
            this.showSearch = this.adapter.options?.terms?.length > 0
        }
        if (changes['columns']) this.generateColumns()

        if (changes['actions']) {
            this.actionsMap = new Map<any, ActionDescriptor[]>()
            this.actionsMenuMap = new Map<any, ActionDescriptor[]>()
        }

        const headerActions = changes['headerActions']?.currentValue ?? this.headerActions

        this._headerActions.set(
            ((Array.isArray(headerActions) ? headerActions : headerActions(this.adapter.normalized, this.selectedNormalized())) || [])
                .map(a => ({ ...a, header: true, bulk: a.bulk || false, menu: a.menu || false }))
        )

    }

    private generateColumns() {
        if (this.columns === 'auto') {
            this._properties = {}
            if (this.adapter.normalized && this.adapter.normalized.length) {
                const columns: any = {}
                this.adapter.normalized.forEach(x => Object.keys(x.item).forEach(k => columns[k] = 1))
                Object.keys(columns).forEach(k => { if (!k.startsWith('_')) this._properties[k] = {} })
            }
        }
        else if (Array.isArray(this.columns)) {
            this._properties = {}
            this.columns.forEach(k => { this._properties[k] = {} })
        }
        else {
            this._properties = {}
            Object.keys(this.columns).forEach(k => {
                if (this.columns[k] === 1) this._properties[k] = {}
                else if (this.columns[k] === 0) this._properties[k] = { visible: false }
                else this._properties[k] = this.columns[k]
            })
        }

        if (this.name && localStorage) {
            const parseJson = (str, def) => {
                if (!str) return def
                try {
                    return JSON.parse(str)
                } catch (e) {
                    return def
                }
            }

            const storageColumnsInfoStr = localStorage.getItem(`table#${this.name}`)
            const storageColumnsInfo = parseJson(storageColumnsInfoStr, [])
            this.allowChangeColumnsOptions = this.allowChangeColumnsOptions || storageColumnsInfo.length > 0
            if (storageColumnsInfo.length > 0) {
                for (const prop in this._properties) {
                    const colInfo = storageColumnsInfo.find(x => x.name === prop) ?? { visible: true, sticky: false }

                    this._properties[prop].visible = colInfo.visible
                    this._properties[prop].sticky = colInfo.sticky
                }
            }
        }


        this._columns = []

        const selectCol = this._properties['select']
        const iCol = this._properties['i']
        const actionsCol = this._properties['actions']
        delete this._properties['select']
        delete this._properties['i']
        delete this._properties['actions']

        if (iCol && iCol.visible !== false) this._columns.push('i')
        if (selectCol === undefined || selectCol.visible !== false)
            this._columns.push('select')


        this._columns.push(...Object.keys(this._properties))

        if (this.actions && (actionsCol === undefined || actionsCol.visible !== false)) {
            this._columns.push('actions')
        }
    }

    async openColumnsSelectDialog() {
        await firstValueFrom(this.dialog.openDialog(ColumnsSelectComponent, {
            title: 'Select columns',
            width: '60%',
            inputs: { data: { table: this.name, columns: this._properties } }
        })
            .afterClosed())
    }


    //actions
    actionsMap = new Map<any, ActionDescriptor[]>()
    actionsMenuMap = new Map<any, ActionDescriptor[]>()
    getActions(item: any): ActionDescriptor[] {

        let actions = this.actionsMap.get(item)
        if (!actions) {

            if (Array.isArray(this.actions)) actions = this.actions
            else actions = this.actions(item)

            actions = actions.filter(a => ActionDescriptor._button(a))
            this.actionsMap.set(item, actions)
        }
        return actions
    }
    getMenuActions(row: T): ActionDescriptor[] {
        if (!row) return []

        let actions = this.actionsMenuMap.get(row)
        if (!actions) {

            if (Array.isArray(this.actions)) actions = this.actions
            else actions = this.actions(row)

            actions = actions.filter(a => ActionDescriptor._menu(a))
            this.actionsMenuMap.set(row, actions)
        }
        return actions
    }

    onAction(descriptor: ActionDescriptor, data: NormalizedItem[] | any[]) {
        //TODO should action set loading automatically just like filter?

        const d = (data || []).map(x => x.item)
        const e = { action: descriptor, data: d }
        if (descriptor.handler) descriptor.handler(e)
        this.action.emit(e)
        this.bus.emit(`${this.name?.trim().length > 0 ? this.name + '-' : ''}${descriptor.action}`, e, this)
    }




    toggleSelection(event: MatCheckboxChange, row, selectInBetween = false) {
        let rows = [row]
        if (selectInBetween) {
            const all = this.adapter.normalized
            const i1 = all.indexOf(row)
            const i2 = all.indexOf(this.focusedItem)

            if (i1 > -1 && i2 > -1) rows = all.slice(Math.min(i1, i2), Math.max(i1, i2) + 1)
        }

        for (const r of rows) {
            if (event.checked) this.select(r.key)
            else this.deselect(r.key)
        }

        this.setFocusedItem(row)

    }


    isPurePipe(pipe: Type<any>): boolean {
        return !!pipe.prototype.constructor.ɵpipe.pure
    }

}

