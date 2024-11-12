import { Component, Input, forwardRef, Output, EventEmitter, TemplateRef, ElementRef, input, viewChild, model, SimpleChanges, computed } from '@angular/core';
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
        this.selectionModel.clear();
        this.control().setValue(undefined);
    }

    keyDown(e: KeyboardEvent, input?: { open: () => void; panelOpen: boolean }) {
        if (!input || input.panelOpen === true) return;
        const shouldOpen = e.key === 'ArrowDown' || (e.key.length === 1 && /[a-z0-9 ]/i.test(e.key));
        if (shouldOpen) this.openedChange(true);
    }

    isPanelOpened = false;
    matSelectInput = viewChild<MatSelect>('selectInput');

    async openedChange(open: boolean, input?: { open: () => void }) {
        this.isPanelOpened = open;
        if (this.viewDataSource.value === 'selected' && open) {
            this.loading.set(true);
            this.viewDataSource.next('adapter');

            await this.loadData();
            setTimeout(() => {
                input?.open();
            }, 250);
        }
    }

    async loadData() {
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
