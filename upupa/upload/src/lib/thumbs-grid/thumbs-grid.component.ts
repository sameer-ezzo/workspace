import {
    Component,
    Input,
    Output,
    EventEmitter,
    forwardRef,
    ElementRef,
    OnDestroy,
    OnChanges,
    SimpleChanges,
    OnInit,
    input,
    output,
} from '@angular/core';
import { UploadClient } from '../upload.client';
import { DataAdapter, NormalizedItem } from '@upupa/data';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatDialog } from '@angular/material/dialog';
import { takeUntil } from 'rxjs';
import { ValueDataComponentBase } from '@upupa/table';
import { FileInfo } from '../model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'thumbs-grid',
    templateUrl: './thumbs-grid.component.html',
    styleUrls: ['./thumbs-grid.component.css'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => ThumbsGridComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => ThumbsGridComponent),
            multi: true,
        },
    ],
})
export class ThumbsGridComponent
    extends ValueDataComponentBase<FileInfo>
    implements OnChanges, OnInit, OnDestroy
{

    thumbs = input<FileInfo[]>([]);
    changed = output<Partial<FileInfo> | Partial<FileInfo>[]>();

    base: string;
    constructor(
        protected host: ElementRef<HTMLElement>,
        protected breakpointObserver: BreakpointObserver,
        protected dialog: MatDialog,
        public client: UploadClient
    ) {
        super();
        this.base = this.client.baseUrl;
        this.loading.set(true);
    }

    override async ngOnChanges(changes: SimpleChanges): Promise<void> {
        super.ngOnChanges(changes);
        if (changes['thumbs']) {
            // this.writeValue(this.thumbs as any, false);
        }
    }

    override ngOnInit() {
        super.ngOnInit();
        this.adapter().refresh();
        this.adapter()
            .dataSource.refresh()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((x) => {
                this.loading.set(false);
            });
    }

    async remove(t: NormalizedItem<FileInfo>) {
        this.loading.set(true);
        if (this.selectionModel.isSelected(t.key))
            this.selectionModel.deselect(t.key);

        try {
            await this.client.delete(
                '/' + t.item.path,
                new URL(this.base).origin
            );
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
