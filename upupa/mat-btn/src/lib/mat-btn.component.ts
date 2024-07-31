import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ViewChild, AfterViewInit } from '@angular/core';

import { MatButton, MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthorizeModule } from '@upupa/authz';
import { ActionDescriptor,ActionEvent } from '@upupa/common';




@Component({
    selector: 'mat-btn',
    templateUrl: './mat-btn.component.html',
    imports: [AuthorizeModule, MatButtonModule, MatIconModule, MatTooltipModule, MatBadgeModule],
    standalone: true
})
export class MatBtnComponent implements OnChanges {
    @Input() descriptor: ActionDescriptor;
    @Input() disabled: boolean = false;

    @ViewChild('button') button: MatButton;
    color = '';
    @Output() action = new EventEmitter<ActionEvent>();




    ngOnChanges(changes: SimpleChanges): void {
        if (changes['descriptor']) {
            // Default the variant to 'button' if not provided
            this.descriptor.variant = this.descriptor.variant || 'button';

            // Set the color only if it's 'primary', 'accent', or 'warn'
            const validColors = ['primary', 'accent', 'warn'];
            this.color = validColors.includes(this.descriptor.color) ? this.descriptor.color : '';

            // Set the disabled status
            this.disabled = this.descriptor.disabled;
            if (this.descriptor.variant === 'icon') this.descriptor.icon ??= 'circle';
            this.descriptor.tooltip ??= this.descriptor.variant === 'icon' && this.descriptor.text ? this.descriptor.text : '';
            if (this.descriptor.tooltip.length) {
                this.descriptor.tooltipPosition ??= 'above'
            }
        }
    }


    async onAction(event) {
        event.preventDefault();
        event.stopPropagation();
        let data = undefined
        if (this.descriptor.handler) data = await this.descriptor.handler({ ...event, action: this.descriptor, data } as ActionEvent);
        else this.action.emit({ ...event, action: this.descriptor, data } as ActionEvent);
    }


}
