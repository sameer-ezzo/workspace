import { Component, forwardRef, ElementRef, OnChanges, input, output } from "@angular/core";
import { UploadClient } from "../upload.client";
import { NormalizedItem } from "@upupa/data";
import { NG_VALUE_ACCESSOR } from "@angular/forms";
import { BreakpointObserver } from "@angular/cdk/layout";
import { MatDialog } from "@angular/material/dialog";
import { ValueDataComponentBase } from "@upupa/table";
import { FileInfo } from "../model";

@Component({
    selector: "thumbs-grid",
    templateUrl: "./thumbs-grid.component.html",
    styleUrls: ["./thumbs-grid.component.css"],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => ThumbsGridComponent),
            multi: true,
        },
    ],
})
export class ThumbsGridComponent extends ValueDataComponentBase<FileInfo> implements OnChanges {
    thumbs = input<FileInfo[]>([]);
    changed = output<Partial<FileInfo> | Partial<FileInfo>[]>();

    base: string;
    constructor(
        protected host: ElementRef<HTMLElement>,
        protected breakpointObserver: BreakpointObserver,
        protected dialog: MatDialog,
        public client: UploadClient,
    ) {
        super();
        this.base = this.client.baseUrl;
        this.loading.set(true);
    }

    // ngOnInit() {
    //     // this.adapter().refresh();
    //     // this.adapter()
    //     //     .dataSource.refresh()
    //     //     .pipe(takeUntilDestroyed(this.destroyRef))
    //     //     .subscribe((x) => {
    //     //         this.loading.set(false);
    //     //     });
    // }

    async remove(t: NormalizedItem<FileInfo>) {
        this.loading.set(true);
        // if (this.isSelected(t.key)) this.selectionModel.deselect(t.key);

        try {
            await this.client.delete("/" + t.item.path, new URL(this.base).origin);
            this.adapter().refresh();
            this.loading.set(false);
        } catch (error) {
            console.error(error);
        }
    }

    apply() {
        this.changed.emit(this.value());
    }
}
