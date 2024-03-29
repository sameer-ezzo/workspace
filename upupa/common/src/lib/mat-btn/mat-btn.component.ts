import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { ActionDescriptor, ActionEvent } from './action-descriptor';

@Component({
  selector: 'mat-btn',
  templateUrl: './mat-btn.component.html',
})
export class MatBtnComponent implements OnChanges {
  @Input() descriptor: ActionDescriptor;
  @Input() disabled: boolean = false;

  color = '';
  @Output() action = new EventEmitter<ActionEvent>();

  constructor() {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['descriptor']) {
      this.descriptor.variant ??= 'button';
      this.color = this.descriptor.color === 'primary' || this.descriptor.color === 'accent' || this.descriptor.color === 'warn' ? this.descriptor.color : '';
      this.disabled = this.descriptor.disabled;
    }
  }


  onAction(event) {
    event.preventDefault();
    event.stopPropagation();
    if (this.descriptor.handler) this.descriptor.handler({ ...event, action: this.descriptor, data: undefined } as ActionEvent);
    this.action.emit({ ...event, action: this.descriptor, data: undefined } as ActionEvent);
  }


}
