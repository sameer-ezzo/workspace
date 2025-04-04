import { Component } from "@angular/core";
import { MatIcon, MatIconModule } from "@angular/material/icon";
import { MatTooltip } from "@angular/material/tooltip";
import { DefaultTableCellTemplate } from "@upupa/table";

@Component({
    selector: "email-column-cell",
    imports: [MatIcon, MatTooltip],
    styles: `
        :host {
            display: flex;
            align-items: center;
        }
    `,
    template: `
        <span>
            {{ item().email }}
        </span>
        <mat-icon style="opacity: 0.6" matTooltip="Unverified">
            {{ !item().emv ? "error" : "" }}
        </mat-icon>
    `
})
export class EmailColumnCellComponent extends DefaultTableCellTemplate {}
