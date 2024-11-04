import { Component, Input, forwardRef, Output, EventEmitter, TemplateRef, ElementRef, input, viewChild, model, SimpleChanges } from '@angular/core';
import { FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatSelect } from '@angular/material/select';
import { ActionDescriptor } from '@upupa/common';
import { ValueDataComponentBase } from '@upupa/table';

import { firstValueFrom } from 'rxjs';
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

    valueTemplate = input<TemplateRef<any>>();
    itemTemplate = input<TemplateRef<any>>();
    _onlySelected = false;

    filterControl = new FormControl<string>('');
    filterInputRef = viewChild.required<ElementRef>('filterInput');
    filterModel = model<string>();
    updateFilter() {
        this.adapter().filter = { terms: [this.filterModel()] };
    }

    clearValue(e) {
        e.stopPropagation();
        this.handleUserInput(undefined);
    }

    keyDown(e: KeyboardEvent, input?: { open: () => void; panelOpen: boolean }) {
        if (!input || input.panelOpen === true) return;
        const shouldOpen = e.key === 'ArrowDown' || (e.key.length === 1 && /[a-z0-9 ]/i.test(e.key));
        if (shouldOpen) this.openedChange(true);
    }

    isPanelOpened = false;
    matSelectInput = viewChild<MatSelect>('selectInput');

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
        this.viewDataSource$.next('adapter');
        this.refreshData();
        await firstValueFrom(this.adapter().normalized$);
    }

    @Output() action = new EventEmitter<ActionDescriptor>();
    @Input() actions: ActionDescriptor[] = [];
    onAction(event: any, action: ActionDescriptor) {
        event.stopPropagation();
        this.action.emit(action);
        // this.bus.emit(action.name, { msg: action.name }, this); //select-{name}-{action}
    }
}
