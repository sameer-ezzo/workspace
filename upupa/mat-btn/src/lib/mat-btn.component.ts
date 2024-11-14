import { Component, output, input, computed } from "@angular/core";

import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatBadgeModule } from "@angular/material/badge";
import { AuthorizeModule } from "@upupa/authz";
import { ActionDescriptor, ActionEvent } from "@upupa/common";
import { JsonPipe } from "@angular/common";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";

@Component({
    selector: "mat-btn",
    templateUrl: "./mat-btn.component.html",
    imports: [AuthorizeModule, MatButtonModule, MatIconModule, MatBadgeModule, JsonPipe, MatProgressSpinnerModule],
    standalone: true,
})
export class MatBtnComponent {
    onClick = output<ActionEvent>();

    loading = input(false);
    descriptor = input.required<ActionDescriptor>();
    disabled = input(false);
    isDisabled = computed(() => this.disabled() || this.descriptor().disabled);
    variant = computed(() => this.descriptor().variant ?? "button");
    color = computed(() => {
        const validColors = ["primary", "accent", "warn"];
        const descriptorColor = this.descriptor().color ?? "";
        if (!validColors.includes(descriptorColor)) console.warn(`Invalid color: ${descriptorColor}`);
        return descriptorColor;
    });

    icon = computed(() => {
        const descriptor = this.descriptor();
        let icon = descriptor.icon;
        if (descriptor.variant === "icon" && !icon) icon = "circle";
        return icon;
    });

    context = input(undefined);
    data = input<any>();

    async onAction(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        this.onClick.emit({
            ...event,
            action: this.descriptor(),
            data: this.data(),
            context: this.context(),
        } as ActionEvent);
    }
}
