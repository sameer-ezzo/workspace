import {
    Component,
    DestroyRef,
    EventEmitter,
    Injector,
    Output,
    Signal,
    SimpleChanges,
    computed,
    effect,
    inject,
    input,
    model,
    output,
    runInInjectionContext,
    signal,
} from "@angular/core";
import { PageEvent } from "@angular/material/paginator";
import { Sort } from "@angular/material/sort";
import { BehaviorSubject, firstValueFrom, map, Subscription } from "rxjs";
import { DataAdapter, NormalizedItem } from "@upupa/data";
import { SelectionModel } from "@angular/cdk/collections";

import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { delay } from "@noah-ark/common";

@Component({
    selector: "data-base",
    template: "",
    styles: [],
})
export class DataComponentBase<T = any> {
    protected readonly selectionModel = new SelectionModel<Partial<T>>(true, [], true);
    readonly selectedNormalized = new BehaviorSubject<NormalizedItem<T>[]>([]);

    add = output();

    loading = signal(false);
    dataLoaded = signal(false);

    noDataImage = input<string>("");

    minAllowed = input<number, number | null | undefined>(0, {
        transform: (v) => Math.max(0, Math.round(Math.abs(v ?? 0))),
    });
    maxAllowed = input<number, number | null | undefined>(1, {
        transform: (v) => Math.max(1, Math.round(Math.abs(v ?? 1))),
    });

    adapter = model.required<DataAdapter<T>>();

    filterDebounceTime = input(300);

    focusedItem = model<NormalizedItem<T>>(null);
    focusedItemChange = output<NormalizedItem<T>>();
    itemClick = output<NormalizedItem<T>>();

    constructor() {
        this.selectionModel.changed.pipe(takeUntilDestroyed()).subscribe((s) => {
            this.updateSelection(s.source.selected);
        });
    }

    async loadData() {
        if (this.dataLoaded()) return;
        if (!this.adapter().dataSource.allDataLoaded) {
            this.loading.set(true);
            this.adapter().refresh();
            await firstValueFrom(this.adapter().normalized$);
            this.loading.set(false);
        }
        this.dataLoaded.set(true);
    }

    items!: Signal<NormalizedItem<T>[]>;
    lazyLoadData = input(false);
    compareWithFn = (optVal: any, selectVal: any) => optVal === selectVal;

    ngOnChanges(changes: SimpleChanges) {
        if (changes["adapter"]) {
            const adapter = this.adapter();
            if (!adapter) throw new Error("Adapter is required");

            const keyProperty = adapter?.keyProperty;

            this.compareWithFn = keyProperty
                ? (optVal: any, selectVal: any) => {
                      if (optVal === selectVal) return true;
                      if (optVal == undefined || selectVal == undefined) return false;
                      return optVal[keyProperty] === selectVal[keyProperty];
                  }
                : (optVal: any, selectVal: any) => optVal === selectVal;

            if (adapter.dataSource.allDataLoaded || !this.lazyLoadData()) this.loadData();

            runInInjectionContext(this.injector, () => {
                this.items = toSignal(this.adapter().normalized$);
            });
        }
    }

    injector = inject(Injector);

    private updateSelection(selection: Partial<T>[]) {
        const keys = this.adapter().getKeysFromValue(selection);
        if (keys == undefined) return this.selectedNormalized.next([]);
        this.adapter()
            .getItems(keys)
            .then((items) => {
                this.selectedNormalized.next(items);
            });
    }

    // eslint-disable-next-line @typescript-eslint/member-ordering
    @Output() pageChange = new EventEmitter<PageEvent>();
    onPageChange(page: PageEvent) {
        this.adapter().page = page;
        this.pageChange.emit(page);
    }

    // eslint-disable-next-line @typescript-eslint/member-ordering
    @Output() sortChange = new EventEmitter<Sort>();
    onSortData(sort: Sort) {
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
