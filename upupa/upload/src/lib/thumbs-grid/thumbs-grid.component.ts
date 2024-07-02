import { Component, Input, Output, EventEmitter, forwardRef, ElementRef, OnDestroy, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { UploadClient } from '../upload.client';
import { DataAdapter, NormalizedItem } from '@upupa/data';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatDialog } from '@angular/material/dialog';
import { takeUntil } from 'rxjs';
import { DataComponentBase } from '@upupa/table';
import { FileInfo } from '../model';

@Component({
  selector: 'thumbs-grid',
  templateUrl: './thumbs-grid.component.html',
  styleUrls: ['./thumbs-grid.component.css'],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ThumbsGridComponent), multi: true, },
  { provide: NG_VALIDATORS, useExisting: forwardRef(() => ThumbsGridComponent), multi: true }

  ]
})
export class ThumbsGridComponent extends DataComponentBase<FileInfo> implements OnChanges, OnInit, OnDestroy {

  @Input() errorMessages = {};

  @Input() thumbs: FileInfo;

  @Output() changed = new EventEmitter();



  base: string;
  constructor(protected host: ElementRef<HTMLElement>,
    protected breakpointObserver: BreakpointObserver,
    protected dialog: MatDialog,
    public client: UploadClient) {
    super();
    this.base = this.client.baseUrl;
    this.loading.set(true);
  }



  override async ngOnChanges(changes: SimpleChanges): Promise<void> {
    super.ngOnChanges(changes);
    if (changes['thumbs']) {
      this.writeValue(this.thumbs);
    }
  }

  override ngOnInit() {
    super.ngOnInit()
    this.adapter.refresh();
    this.adapter.dataSource.refresh().pipe(takeUntil(this.destroy$)).subscribe(x => {
      this.loading.set(false);
    });
  }

  async remove(t: NormalizedItem<FileInfo>) {
    this.loading.set(true);
    if (this.selectionModel.isSelected(t.key)) this.selectionModel.deselect(t.key);

    try {
      await this.client.delete('/' + t.item.path, new URL(this.base).origin);
      this.adapter.normalized.splice(this.adapter.normalized.indexOf(t), 1);
      this.loading.set(false);
    } catch (error) {
      console.error(error);
    }
  }

  apply() {

    this.changed.emit(this.value);
  }
}
