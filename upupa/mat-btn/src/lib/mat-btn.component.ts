import { Component, output, input, computed, runInInjectionContext, Injector, inject } from "@angular/core";

import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatBadgeModule } from "@angular/material/badge";
import { AuthorizeModule } from "@upupa/authz";
import { ActionDescriptor, ActionEvent } from "@upupa/common";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";

@Component({
    selector: "mat-btn",
    templateUrl: "./mat-btn.component.html",
    imports: [AuthorizeModule, MatButtonModule, MatIconModule, MatBadgeModule, MatProgressSpinnerModule],
    host: {
        "[attr.disabled]": "isDisabled()",
    }
})
export class MatBtnComponent {
    action = output<ActionEvent | any>();

    loading = input(false);
    buttonDescriptor = input.required<ActionDescriptor>();
    disabled = input(false);
    isDisabled = computed(() => this.loading() || this.disabled() || this.buttonDescriptor().disabled);
    variant = computed(() => this.buttonDescriptor().variant ?? "button");
    color = computed(() => {
        const validColors = ["primary", "accent", "warn"];
        const descriptorColor = this.buttonDescriptor().color ?? "";
        if (!validColors.includes(descriptorColor)) console.warn(`Invalid color: ${descriptorColor}`);
        return descriptorColor;
    });

    icon = computed(() => {
        const descriptor = this.buttonDescriptor();
        let icon = descriptor["icon"] ?? descriptor["symbol"];
        if (descriptor.variant === "icon" && !icon) icon = "circle";
        return icon;
    });

    context = input(undefined);
    data = input<any>();
    private readonly injector = inject(Injector);
    async onAction(event: Event) {
        event.preventDefault();
        event.stopPropagation();
        if (this.isDisabled()) return;
        runInInjectionContext(this.injector, () => {
            const e = {
                event,
                descriptor: this.buttonDescriptor(),
                data: this.data(),
                context: this.context(),
                componentRef: this,
                timestamp: new Date(),
            } as ActionEvent;
            this.action.emit(e);
        });
    }
}
