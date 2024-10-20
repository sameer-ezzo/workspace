import {
    Component,
    Input,
    forwardRef,
    Output,
    EventEmitter,
    TemplateRef,
    ViewChild,
    ElementRef,
    input,
    viewChild,
    model,
} from '@angular/core';
import { FormControl, NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatSelect } from '@angular/material/select';
import { ActionDescriptor, EventBus } from '@upupa/common';
import { ValueDataComponentBase } from '@upupa/table';

import { firstValueFrom, Subscription } from 'rxjs';
import { InputDefaults } from '../defaults';

@Component({
    selector: 'form-select',
    templateUrl: './select.component.html',
    styles: [``],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => SelectComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => SelectComponent),
            multi: true,
        },
    ],
})
export class SelectComponent<T = any> extends ValueDataComponentBase<T> {
    inlineError = true;
    showSearch = input(false);

    appearance = input(InputDefaults.appearance);
    floatLabel = input(InputDefaults.floatLabel);
    label = input('');
    panelClass = input('');
    placeholder = input('');
    hint = input('');
    errorMessages = input<Record<string, string>>({});
    valueTemplate = input<TemplateRef<any>>();
    itemTemplate = input<TemplateRef<any>>();
    _onlySelected = false;

    filterControl = new FormControl<string>('');
    filterInputRef = viewChild.required<ElementRef>('filterInput');
    filterModel = model<string>();
    updateFilter() {
        // this.adapter.filter = { terms: [this.filterModel()] };
    }

    clearValue(e) {
        e.stopPropagation();
        this.valueChanged(undefined);
    }

    keyDown(
        e: KeyboardEvent,
        input?: { open: () => void; panelOpen: boolean }
    ) {
        if (!input || input.panelOpen === true) return;
        const shouldOpen =
            e.key === 'ArrowDown' ||
            (e.key.length === 1 && /[a-z0-9 ]/i.test(e.key));
        if (shouldOpen) this.openedChange(true);
    }

    isPanelOpened = false;
    paginatorSubscription: Subscription;
    @ViewChild('selectInput') selectInput: MatSelect;

    removeScrollPaginator(selectInput: MatSelect) {
        this.paginatorSubscription?.unsubscribe();
        this.paginatorSubscription = null;
    }

    firstLoaded = false;
    async openedChange(open: boolean, input?: { open: () => void }) {
        this.isPanelOpened = open;
        if (!this.firstLoaded && open) {
            await this.loadData();
            setTimeout(() => {
                input?.open();
            }, 250);
        }
        // if (open) this.setScrollPaginator(selectInput)
        // else this.removeScrollPaginator(selectInput)
    }

    async loadData() {
        this.refreshData();
        this.viewDataSource$.next('adapter');
        await firstValueFrom(this.adapter().normalized$);
    }

    async valueChanged(key: keyof T | (keyof T)[]) {
        this.control().markAsDirty();
        this.selectionModel.clear();
        if (key === undefined) return;
        if (Array.isArray(key)) key.forEach((k) => this.select(k));
        else this.select(key);
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

    @Output() action = new EventEmitter<ActionDescriptor>();
    @Input() actions: ActionDescriptor[] = [];
    onAction(event: any, action: ActionDescriptor) {
        event.stopPropagation();
        this.action.emit(action);
        // this.bus.emit(action.name, { msg: action.name }, this); //select-{name}-{action}
    }
}
