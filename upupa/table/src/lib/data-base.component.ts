import { Component, DestroyRef, EventEmitter, Output, SimpleChanges, computed, effect, inject, input, model, output, signal } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { Subscription } from 'rxjs';
import { DataAdapter, NormalizedItem } from '@upupa/data';
import { SelectionModel } from '@angular/cdk/collections';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'data-base',
    template: '',
    styles: [],
})
export class DataComponentBase<T = any> {
    selectionModel: SelectionModel<Partial<T>>;
    readonly selectedNormalized = signal<NormalizedItem<T> | NormalizedItem<T>[]>([]);
    readonly selectedNormalizedArray = computed<NormalizedItem<T>[]>(() => {
        const n = this.selectedNormalized();
        return Array.isArray(n) ? n : [n];
    });

    add = output();

    loading = signal(false);
    firstLoad = signal(true);

    noDataImage = input<string>('');

    minAllowed = input<number, number | null | undefined>(0, { transform: (v) => (Number.isNaN(v) ? 0 : Math.max(0, v)) });
    maxAllowed = input<number, number | null | undefined>(Number.MAX_SAFE_INTEGER, { transform: (v) => (Number.isNaN(v) ? Number.MAX_SAFE_INTEGER : Math.max(0, v)) });

    adapter = model.required<DataAdapter<T>>();
    normalized$sub: Subscription;
    filterDebounceTime = input(300);

    focusedItem = model<NormalizedItem<T>>(null);
    focusedItemChange = output<NormalizedItem<T>>();
    itemClick = output<NormalizedItem<T>>();

    constructor() {
        effect(() => {
            const maxAllowed = this.maxAllowed();
            const adapter = this.adapter();
            if (!adapter) return;
            if (maxAllowed === 1) {
                this.selectionModel = new SelectionModel<Partial<T>>(false, undefined, true);
            } else {
                this.selectionModel = new SelectionModel<Partial<T>>(true, [], true);
            }
            this.selectionModel.changed.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((s) => {
                const keys = adapter.getKeysFromValue(s.source.selected);
                adapter.getItems(keys).then((items) => {
                    this.selectedNormalized.set(items);
                });
            });
        });
    }

    refreshData() {
        this.loading.set(true);
        this.adapter()?.refresh();
    }

    protected readonly destroyRef = inject(DestroyRef);
    async ngOnChanges(changes: SimpleChanges) {
        if (changes['adapter']) {
            this.firstLoad.set(true);
            if (!this.adapter()) throw new Error('Adapter is required');

            this.adapter()
                .normalized$.pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe((data) => {
                    this.onDataChange(data);
                });
        }
    }

    get selected() {
        if (this.maxAllowed() === 1) return this.selectionModel.selected[0];
        return this.selectionModel.selected;
    }
    dataChangeListeners: ((data: NormalizedItem<T>[]) => void)[] = [];
    onDataChange(data: NormalizedItem<T>[]) {
        this.firstLoad.set(false);
        this.dataChangeListeners.forEach((x) => x(data));
        this.loading.set(false);
    }

    ngOnDestroy() {
        this.normalized$sub?.unsubscribe();
    }

    // eslint-disable-next-line @typescript-eslint/member-ordering
    @Output() pageChange = new EventEmitter<PageEvent>();
    onPageChange(page: PageEvent) {
        this.loading.set(true);
        this.adapter().page = page;
        this.pageChange.emit(page);
    }

    // eslint-disable-next-line @typescript-eslint/member-ordering
    @Output() sortChange = new EventEmitter<Sort>();
    onSortData(sort: Sort) {
        this.loading.set(true);
        this.adapter().sort = sort;
        this.sortChange.emit(sort);
    }

    //selection
    toggleSelectAll() {
        //selection can have items from data from other pages or filtered data so:
        //if selected items n from this adapter data < adapter data -> select the rest
        //else unselect all items from adapter data only

        const adapter = this.adapter();
        const selected = this.selectionModel.selected;
        if (this.maxAllowed() === 1) {
            if (selected.length > 0) this.selectionModel.clear();
            return;
        }

        if (adapter.normalized.length === selected.length) this.selectionModel.deselect(...selected);
        else this.selectionModel.select(...adapter.normalized.map((x) => x.value));
    }

    select(value: Partial<T> | Partial<T>[]) {
        const v = Array.isArray(value) ? value : [value];
        this.selectionModel.select(...v);
    }

    deselect(value: Partial<T>) {
        this.selectionModel.deselect(value);
    }

    toggle(value: Partial<T>) {
        if (this.selectionModel.isSelected(value)) this.deselect(value);
        else this.select(value);
    }

    setFocusedItem(row) {
        this.focusedItem = row;
        this.focusedItemChange.emit(this.focusedItem());
    }
    nextFocusedItem() {
        const i = this.focusedItem() ? this.adapter().normalized.indexOf(this.focusedItem()) : -1;
        this.focusedItem.set(this.adapter().normalized[i + 1]);
        this.focusedItemChange.emit(this.focusedItem());
    }
    prevFocusedItem() {
        const i = this.focusedItem() ? this.adapter().normalized.indexOf(this.focusedItem()) : this.adapter().normalized.length;
        this.focusedItem.set(this.adapter().normalized[i - 1]);
        this.focusedItemChange.emit(this.focusedItem());
    }

    onLongPress(row: NormalizedItem<T>) {
        this.focusedItem.set(row);
        this.selectionModel.toggle(row.key);
        this.longPressed = row; //to notify click about it
    }
    longPressed: NormalizedItem<T>;
    onClick(row: NormalizedItem<T>) {
        this.focusedItem.set(row);
        this.focusedItemChange.emit(this.focusedItem());

        if (this.longPressed) this.select(row.key);
        else {
            if (this.selectionModel.selected.length > 0) this.selectionModel.toggle(row.key);
            else this.itemClick.emit(this.focusedItem());
        }

        this.longPressed = null; //clear long press notification
    }
}
