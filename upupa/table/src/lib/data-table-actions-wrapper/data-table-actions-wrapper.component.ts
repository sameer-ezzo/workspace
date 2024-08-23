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
} from '@angular/core';
import { ActionDescriptor, ActionEvent } from '@upupa/common';

@Component({
  selector: 'data-table-actions-wrapper',
  templateUrl: './data-table-actions-wrapper.component.html',
  styleUrls: ['./data-table-actions-wrapper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTableActionsWrapperComponent<T = any> implements OnChanges {
  @HostBinding('attr.tabindex') tabindex = 0;

  @Input() context: any;
  @Input() actions:
    | ActionDescriptor[]
    | ((context: any) => ActionDescriptor[]) = [];
  // this represents the actions that will be shown in the header of the table

  @Output() action = new EventEmitter<ActionEvent>();

  _actions = signal<ActionDescriptor[]>([]);
  _menuActions = signal<ActionDescriptor[]>([]);

  ngOnChanges(changes: SimpleChanges) {
    if (changes['actions'] || changes['context']) {
      const { data } = this.context;
      const items = data.map((x) => x.item);

      const actions = Array.isArray(this.actions)
        ? this.actions
        : this.actions(items);

      this._actions.set(actions.filter((a) => !a.menu));
      this._menuActions.set(actions.filter((a) => a.menu));
    }
  }

  onAction(e: ActionEvent) {
    const data = e.context.data;
    this.action.emit({
      action: e.action,
      data: data.map((d) => d.item as T),
      context: this.context,
    });
  }
}
