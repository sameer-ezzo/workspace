import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from "@angular/core";

import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatBadgeModule } from "@angular/material/badge";
import { AuthorizeModule } from "@upupa/authz";
import { ActionDescriptor, ActionEvent } from "@upupa/common";

@Component({
    selector: "mat-btn",
    templateUrl: "./mat-btn.component.html",
    imports: [AuthorizeModule, MatButtonModule, MatIconModule, MatBadgeModule],
    standalone: true,
})
export class MatBtnComponent implements OnChanges {
    @Input() descriptor: ActionDescriptor;
    @Input() disabled = false;

    color = "";
    @Output() action = new EventEmitter<ActionEvent>();

    ngOnChanges(changes: SimpleChanges): void {
        if (changes["descriptor"]) {
            // Default the variant to 'button' if not provided
            this.descriptor.variant = this.descriptor.variant || "button";

            // Set the color only if it's 'primary', 'accent', or 'warn'
            const validColors = ["primary", "accent", "warn"];
            const descriptorColor = this.descriptor.color ?? "";
            this.color = validColors.includes(descriptorColor) ? descriptorColor : "";

            // Set the disabled status
            this.disabled = this.descriptor.disabled ?? false;
            if (this.descriptor.variant === "icon") this.descriptor.icon ??= "circle";
            this.descriptor.tooltip ??= this.descriptor.variant === "icon" && this.descriptor.text ? this.descriptor.text : "";
            if (this.descriptor.tooltip.length) {
                this.descriptor.tooltipPosition ??= "above";
            }
        }
    }

    @Input() context: any;
    @Input() data: any;

    async onAction(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        this.action.emit({ ...event, action: this.descriptor, data: this.data, context: this.context } as ActionEvent);
    }
}
