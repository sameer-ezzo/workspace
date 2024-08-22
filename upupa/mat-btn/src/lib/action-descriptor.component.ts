import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ViewChild, inject, Renderer2, ElementRef } from '@angular/core';

import { ActionDescriptor, ActionEvent } from '@upupa/common';
import { MatBtnComponent } from './mat-btn.component';
import { CommonModule } from '@angular/common';


@Component({
    selector: 'mat-action',
    templateUrl: './action-descriptor.component.html',
    imports: [CommonModule, MatBtnComponent],
    standalone: true
})
export class ActionDescriptorComponent {
    @Input() descriptor: ActionDescriptor;
    @Input() context: any

    @Output() action = new EventEmitter<ActionEvent>();

    async onAction(event: ActionEvent) {
        this.action.emit({ ...event, data: this.context?.data, context: { ...this.context, ...event.context } });
    }


}
