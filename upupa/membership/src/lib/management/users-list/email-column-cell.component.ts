import { Component } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { DefaultTableCellTemplate } from "@upupa/table";

@Component({
    selector: "email-column-cell",
    standalone: true,
    imports: [MatIconModule],
    template: `
        <span>
            {{ item().email }}
        </span>
        <mat-icon style="opacity: 0.6" matTooltip="Unverified">
            {{ item().email && item().emv === true ? "check_circle" : "error" }}
        </mat-icon>
    `,
    styles: [``],
})
export class EmailColumnCellComponent extends DefaultTableCellTemplate {}
