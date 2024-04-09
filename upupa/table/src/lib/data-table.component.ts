import { Component, EventEmitter, OnChanges, Input, Output, SimpleChanges, Type, ElementRef, forwardRef, ViewChild, ChangeDetectionStrategy, AfterViewInit, inject, ChangeDetectorRef } from '@angular/core'
import { takeUntil } from 'rxjs/operators'

import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout'
import { MatDialog } from '@angular/material/dialog'
import { ColumnsSelectComponent } from './columns-select.component/columns-select.component'
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms'

import { NormalizedItem } from '@upupa/data'

import { ActionDescriptor, ActionEvent, EventBus } from '@upupa/common'
import { MatCheckboxChange } from '@angular/material/checkbox'
import { firstValueFrom } from 'rxjs'
import { DataComponentBase } from './datacomponent-base.component'
import { animate, state, style, transition, trigger } from '@angular/animations'


export type PipeDescriptor = { pipe: Type<any>, args: string[] }
export type PipesDescriptor = { [column: string]: PipeDescriptor | Type<any> }

export type ColumnDescriptor = {
    header?: string,
    width?: number,
    visible?: boolean,
    sticky?: 'start' | 'end'
    sortDisabled?: boolean,
    pipe?: PipeDescriptor | Type<any>
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
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataTableComponent<T = any> extends DataComponentBase<T> implements OnChanges, AfterViewInit {


    showSearch = false // will be set to true if there are terms in the adapter
    hasHeader = false // will be set to true if showSearch is true or there are bulk actions or header actions

    @Input() actions: ActionDescriptor[] | ((item: any) => ActionDescriptor[]) = []
    @Input() dragDropDisabled = true

    @Input() rowClass: (item: NormalizedItem<T>) => string = (item) => item.key.toString()
    @Output() action = new EventEmitter<ActionEvent>()

    bulkActions: ActionDescriptor[]
    headerActions: ActionDescriptor[]

    _headerActionsInMenu = undefined
    get headerActionsInMenu() {
        if (this._headerActionsInMenu === undefined)
            this._headerActionsInMenu = this.headerActions?.filter(a => ActionDescriptor._header(a) && ActionDescriptor._menu(a))
        return this._headerActionsInMenu
    }
    get hasHeaderActionsMenu() {
        return this.headerActionsInMenu?.length > 0 || this.allowChangeColumnsVisibility
    }
    @Input() pageSizeOptions = [10, 25, 50, 100]


    _properties: ColumnsDescriptorStrict = {} //only data columns
    _columns: string[] = []
    @Input() columns: string[] | ColumnsDescriptor | 'auto' = 'auto' //eventually columns are the container of all and it's a dictionary
    @Input() templates: any = {}

    @Input() expandable: 'single' | 'multi' | 'none' = 'none'
    @Input() expandedTemplate: any = null


    @Input() cellTemplate: any
    @ViewChild('defaultTemplate') defaultTemplate: any

    @Input() allowChangeColumnsVisibility = false

    get hasValue() {
        return !this.value ? false : Array.isArray(this.value) ? this.value?.length > 0 : true
    }




    ngAfterViewInit(): void {
        if (!this.cellTemplate) this.cellTemplate = this.defaultTemplate
    }

    constructor(protected host: ElementRef<HTMLElement>,
        private bus: EventBus,
        protected breakpointObserver: BreakpointObserver, protected dialog: MatDialog) {
        super()
        this.maxAllowed = Infinity
    }


    handset: boolean
    @Output() selectionChange = new EventEmitter<(string | number | symbol)[]>()
    override ngOnInit() {
        super.ngOnInit()

        this.dataChangeListeners.push(data => { if (this.columns === 'auto') this.generateColumns() })

        this.breakpointObserver.observe([Breakpoints.Handset]).pipe(takeUntil(this.destroy$))
            .subscribe(result => { this.handset = result.matches })

        this.selectionModel.changed.subscribe(x => {
            this.selectionChange.emit(x.source.selected)
            this._updateHeaderBulkActionsDisableState()
        })
    }


    private readonly cdRef = inject(ChangeDetectorRef)
    private _updateHeaderBulkActionsDisableState() {
        const bulkActionsDisabled = this.selectionModel.selected.length === 0
        this.bulkActions.forEach(a => { a.disabled = bulkActionsDisabled })
        this.cdRef.markForCheck()
    }


    override async ngOnChanges(changes: SimpleChanges) {
        await super.ngOnChanges(changes)
        if (this.adapter) {
            this.showSearch = this.adapter?.options?.terms?.length > 0
        }
        if (changes['actions']) {
            this.generateColumns()
            if (this.actions === null) this.actions = []
            const actions = Array.isArray(this.actions) ? this.actions : this.actions(null)
            this.bulkActions = actions?.length ? actions.filter(a => ActionDescriptor._bulk(a)) : []
            this.headerActions = actions?.length ? actions.filter(a => ActionDescriptor._header(a)) : []

            this._updateHeaderBulkActionsDisableState()
        }
        if (changes['columns']) this.generateColumns()

        this.hasHeader = this.showSearch === true || this.bulkActions?.length > 0 || this.headerActions?.length > 0
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
            const selectedColumnsStr = localStorage.getItem(`table#${this.name}`)
            if (selectedColumnsStr) {
                const selectedColumns = selectedColumnsStr.split(',')
                for (const prop in this._properties) {
                    this._properties[prop].visible = selectedColumns.includes(prop)
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
        await firstValueFrom(this.dialog.open(ColumnsSelectComponent, { data: { table: this.name, columns: this._properties }, width: '60%' })
            .afterClosed())
    }


    //actions
    actionsMap = new Map<any, ActionDescriptor[]>()
    actionsMenuMap = new Map<any, ActionDescriptor[]>()
    getActions(item: any): ActionDescriptor[] {
        // console.log(this.calls++)

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
        const d = (data ?? []).map(x => x.item ?? x)
        const e = { action: descriptor, data: d }
        if (descriptor.handler) descriptor.handler(e)
        this.action.emit(e)
        this.bus.emit(`${this.name?.trim().length > 0 ? this.name + '-' : ''}${descriptor.action}`, e, this)
    }

    bulkActionsData = (value: any | any[]) => this.adapter.normalized.filter(n => value.includes(n.key))



    toggleSelection(event: MatCheckboxChange, row, selectInBetween = false) {
        let rows = [row]
        if (selectInBetween) {
            const all = this.adapter.normalized
            const i1 = all.indexOf(row)
            const i2 = all.indexOf(this.focusedItem)

            if (i1 > -1 && i2 > -1) rows = all.slice(Math.min(i1, i2), Math.max(i1, i2) + 1)
        }

        for (const r of rows) {
            if (event.checked) this.select(r.value)
            else this.deselect(r.value)
        }

        this.setFocusedItem(row)

    }


}

