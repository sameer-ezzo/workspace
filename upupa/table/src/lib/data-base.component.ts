import { Component, DestroyRef, EventEmitter, Input, Output, SimpleChanges, computed, effect, inject, input, model, output, signal } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { Subscription, BehaviorSubject, Observable, firstValueFrom, of } from 'rxjs';
import { shareReplay, switchMap } from 'rxjs/operators';
import { DataAdapter, NormalizedItem } from '@upupa/data';
import { SelectionModel } from '@angular/cdk/collections';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'data-base',
    template: '',
    styles: [],
})
export class DataComponentBase<T = any> {
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

    ngOnInit() {
        this.selectionModel.changed.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((s) => {
            this.adapter().getItems(s.source.selected);
            // .then((selected) => {
            //     this.selectedNormalized = selected;
            //     this.singleSelected.set(this.selectedNormalized?.[0]?.key);
            // });
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

    dataChangeListeners: ((data: NormalizedItem<T>[]) => void)[] = [];
    onDataChange(data: NormalizedItem<T>[]) {
        this.firstLoad.set(false);
        this.dataChangeListeners.forEach((x) => x(data));
        this.selectedNormalized = this.selected.map((k) => data.find((d) => d.key === k)).filter((x) => x);
        this.singleSelected.set(this.selectedNormalized?.[0]?.key);

        console.log('onDataChange', this.selectedNormalized, this.singleSelected());

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

    singleSelected = signal(undefined);

    //selection
    selectionModel = new SelectionModel<keyof T>(true, [], true);
    toggleSelectAll() {
        //selection can have items from data from other pages or filtered data so:
        //if selected items n from this adapter data < adapter data -> select the rest
        //else unselect all items from adapter data only

        const selected = this.selected as (keyof T)[];
        if (this.maxAllowed() === 1) {
            if (this.selected.length > 0) this.selectionModel.clear(false);
        } else {
            if (this.adapter().normalized.length === selected.length) this.selectionModel.deselect(...selected);
            else {
                this.selectionModel.select(...this.adapter().normalized.map((n) => n.key));
            }
        }
    }

    select(...keys: (keyof T)[]) {
        if (this.maxAllowed() === 1) {
            this.selectionModel.clear(false);
            this._selectedNormalized$.next([]);
        }
        this.selectionModel.select(...keys);
    }

    deselect(key: keyof T) {
        this.selectionModel.deselect(key);
    }
    toggle(key: keyof T) {
        if (this.selectionModel.isSelected(key)) this.deselect(key);
        else this.select(key);
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

    get selected(): (keyof T)[] {
        return this.selectionModel.selected;
    }
    @Input()
    set selected(n: keyof T | (keyof T)[]) {
        this.selectionModel.clear(false);
        this._selectedNormalized$.next([]);
        if (n === undefined) return;
        const v = (Array.isArray(n) ? n : [n]) as (keyof T)[];
        this.selectionModel.select(...(v as any[]));
    }

    private readonly _selectedNormalized$ = new BehaviorSubject<NormalizedItem<T>[]>([]);
    selectedNormalized$ = this._selectedNormalized$.pipe(shareReplay(1));

    public get selectedNormalized(): NormalizedItem<T>[] {
        return this._selectedNormalized$.value;
    }
    protected set selectedNormalized(v: NormalizedItem<T>[]) {
        this._selectedNormalized$.next(v);
    }
}
