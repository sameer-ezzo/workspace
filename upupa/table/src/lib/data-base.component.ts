import {
    Component,
    DestroyRef,
    EventEmitter,
    Input,
    Output,
    SimpleChanges,
    computed,
    inject,
    input,
    model,
    output,
    signal,
} from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { Subscription, BehaviorSubject, Subject, Observable, of } from 'rxjs';
import {
    debounceTime,
    distinctUntilChanged,
    map,
    shareReplay,
    startWith,
    switchMap,
    takeUntil,
    tap,
} from 'rxjs/operators';
import {
    ClientDataSource,
    DataAdapter,
    FilterDescriptor,
    Key,
    NormalizedItem,
} from '@upupa/data';
import { SelectionModel } from '@angular/cdk/collections';

import { FormControl } from '@angular/forms';
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

    minAllowed = input(0);
    maxAllowed = input(null);

    adapter = input.required<DataAdapter<T>>();
    normalized$sub: Subscription;
    filterDebounceTime = input(300);

    focusedItem = model<NormalizedItem<T>>(null);
    focusedItemChange = output<NormalizedItem<T>>();
    itemClick = output<NormalizedItem<T>>();

    viewDataSource$ = new BehaviorSubject<'adapter' | 'selected'>('adapter');

    items$: Observable<NormalizedItem<T>[]> = this.viewDataSource$.pipe(
        switchMap((view) =>
            view === 'adapter'
                ? this.adapter().normalized$
                : this.selectedNormalized$
        )
    );

    ngOnInit() {
        this.selectionModel.changed
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(async (s) => {
                const selectedNormalized = await this.adapter().getItems(
                    s.source.selected
                );
                this.selectedNormalized = selectedNormalized;
                this.singleSelected.set(this.selectedNormalized?.[0]?.key);
            });
    }

    refreshData() {
        this.loading.set(true);
        this.adapter()?.refresh();
    }

    protected readonly destroyRef = inject(DestroyRef);
    async ngOnChanges(changes: SimpleChanges) {
        if (changes['adapter']) {
            if (!this.adapter) throw new Error('Adapter is required');
            this.firstLoad.set(true);

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
        this.selectedNormalized = this.selected
            .map((k) => data.find((d) => d.key === k))
            .filter((x) => x);
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
            if (this.adapter().normalized.length === selected.length)
                this.selectionModel.deselect(...selected);
            else {
                this.selectionModel.select(
                    ...this.adapter().normalized.map((n) => n.key)
                );
            }
        }
    }

    select(key: keyof T) {
        if (this.maxAllowed() === 1) this.selectionModel.clear(false);
        this.selectionModel.select(key);
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
        const i = this.focusedItem()
            ? this.adapter().normalized.indexOf(this.focusedItem())
            : -1;
        this.focusedItem.set(this.adapter().normalized[i + 1]);
        this.focusedItemChange.emit(this.focusedItem());
    }
    prevFocusedItem() {
        const i = this.focusedItem()
            ? this.adapter().normalized.indexOf(this.focusedItem())
            : this.adapter().normalized.length;
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
            if (this.selectionModel.selected.length > 0)
                this.selectionModel.toggle(row.key);
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
        if (n === undefined) return;
        const v = (Array.isArray(n) ? n : [n]) as (keyof T)[];
        this.selectionModel.select(...(v as any[]));
    }

    private readonly _selectedNormalized$ = new BehaviorSubject<
        NormalizedItem<T>[]
    >([]);
    selectedNormalized$ = this._selectedNormalized$.pipe(shareReplay(1));

    public get selectedNormalized(): NormalizedItem<T>[] {
        return this._selectedNormalized$.value;
    }
    protected set selectedNormalized(v: NormalizedItem<T>[]) {
        this._selectedNormalized$.next(v);
    }
}
