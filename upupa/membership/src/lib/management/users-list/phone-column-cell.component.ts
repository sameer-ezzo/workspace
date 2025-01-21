import { Component } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { DefaultTableCellTemplate } from "@upupa/table";

@Component({
    selector: "phone-column-cell",
    imports: [MatIconModule],
    template: `
        @if (item().phone && item().phv) {
            <mat-icon>check</mat-icon>
        }
        @if (item().phone && !item().phv) {
            <mat-icon>error</mat-icon>
        }
        {{ item().phone }}
    `,
    styles: [``],
})
export class PhoneColumnCellComponent extends DefaultTableCellTemplate {}
