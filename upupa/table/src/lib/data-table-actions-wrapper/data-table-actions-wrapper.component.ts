import { Component, EventEmitter, OnChanges, Input, Output, SimpleChanges, ChangeDetectionStrategy, signal, HostBinding } from '@angular/core'
import { NormalizedItem } from '@upupa/data'
import { ActionDescriptor, ActionEvent } from '@upupa/common'

export type ActionsWrapperViewModel<T> = NormalizedItem<T> | NormalizedItem<T>[] | null
export type ActionsContext<T> = T | T[]

@Component({
    selector: 'data-table-actions-wrapper',
    templateUrl: './data-table-actions-wrapper.component.html',
    styleUrls: ['./data-table-actions-wrapper.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataTableActionsWrapperComponent<T = any> implements OnChanges {
    @HostBinding('attr.tabindex') tabindex = 0

    @Input() context: ActionsWrapperViewModel<T> = null
    @Input() actions: ActionDescriptor[] | ((context: ActionsContext<T>) => ActionDescriptor[]) = []
    // this represents the actions that will be shown in the header of the table

    @Output() action = new EventEmitter<ActionEvent>()

    _actions = signal<ActionDescriptor[]>([])
    _menuActions = signal<ActionDescriptor[]>([])


    ngOnChanges(changes: SimpleChanges) {
        if (changes['actions'] || changes['context']) {
            const data = Array.isArray(this.context) ? this.context.map(x => x.item) : this.context?.item
            console.log('data', data);

            const actions = Array.isArray(this.actions) ? this.actions : this.actions(data)
            this._actions.set(actions.filter(a => !ActionDescriptor._menu(a)))
            this._menuActions.set(actions.filter(a => ActionDescriptor._menu(a)))
        }
    }

    onAction(descriptor: ActionDescriptor) {
        //TODO should action set loading automatically just like filter?

        const data = Array.isArray(this.context) ? this.context : [this.context]
        const e = { action: descriptor, data: data.map(d => d.item as T) }
        if (descriptor.handler) descriptor.handler(e)
        this.action.emit(e)
    }
}

