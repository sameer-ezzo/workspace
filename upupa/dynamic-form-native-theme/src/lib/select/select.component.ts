import { Component, Input, forwardRef, Output, EventEmitter, TemplateRef, ViewChild, ElementRef } from '@angular/core'
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms'
import { MatSelect } from '@angular/material/select'
import { ActionDescriptor, EventBus } from '@upupa/common'
import { DataComponentBase, ValueDataComponentBase } from '@upupa/table'
import { Key, NormalizedItem } from '@upupa/data'

import { firstValueFrom, map, Subscription } from 'rxjs'
import { InputDefaults } from '../defaults'

@Component({
    selector: 'form-select',
    templateUrl: './select.component.html',
    styles: [``],
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SelectComponent), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => SelectComponent), multi: true }
    ]
})
export class SelectComponent<T = any> extends ValueDataComponentBase<T> {
    inlineError = true
    showSearch = false


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
    constructor(protected readonly bus: EventBus) {
        super()
    }



    clearValue(e) {
        e.stopPropagation();
        this.valueChanged(undefined)
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

    async valueChanged(key: keyof T | (keyof T)[]) {
        this.control.markAsDirty()
        if (key === undefined) this.selectionModel.clear()
        else {
            if (Array.isArray(key)) key.forEach(k => this.select(k))
            else this.select(key)
        }
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