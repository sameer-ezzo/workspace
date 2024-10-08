import {
    Component,
    EventEmitter,
    OnChanges,
    Input,
    Output,
    SimpleChanges,
    ChangeDetectionStrategy,
    signal,
    HostBinding,
    input,
    computed,
} from '@angular/core';
import { ActionDescriptor, ActionEvent } from '@upupa/common';

@Component({
    selector: 'data-table-actions-wrapper',
    templateUrl: './data-table-actions-wrapper.component.html',
    styleUrls: ['./data-table-actions-wrapper.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTableActionsWrapperComponent<T = any> {
    @HostBinding('attr.tabindex') tabindex = 0;

    context = input.required<any>();
    actions = input.required<
        ActionDescriptor[] | ((context: any) => ActionDescriptor)[]
    >();
    // this represents the actions that will be shown in the header of the table

    @Output() action = new EventEmitter<ActionEvent>();

    __actions = computed<ActionDescriptor[]>(() => {
        const actions = this.actions();
        const { data } = this.context();
        const res = actions
            .map((a) => (typeof a === 'function' ? a : (data) => a))
            .map((fn) => fn(data))
            .filter((a) => a);
        return res;
    });
    inlineActions = computed<ActionDescriptor[]>(() =>
        this.__actions().filter((a) => !a.menu)
    );
    menuActions = computed<ActionDescriptor[]>(() =>
        this.__actions().filter((a) => a.menu)
    );

    onAction(e: ActionEvent) {
        const data = e.context.data;
        this.action.emit({
            action: e.action,
            data: data.map((d) => d.item as T),
            context: this.context(),
        });
    }
}
