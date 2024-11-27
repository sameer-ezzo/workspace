import { Component, EventEmitter, Injector, OnChanges, Output, SimpleChanges, computed, effect, forwardRef, inject, input, model, output, signal } from "@angular/core";
import { PageEvent } from "@angular/material/paginator";
import { Sort } from "@angular/material/sort";
import { firstValueFrom } from "rxjs";
import { DataAdapter, NormalizedItem } from "@upupa/data";
import { SelectionModel } from "@angular/cdk/collections";
import { AbstractControl, ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, NgControl, UntypedFormControl, ValidationErrors, Validator } from "@angular/forms";

@Component({
    selector: "data-base",
    template: "",
    styles: [],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => DataComponentBase),
            multi: true,
        },
    ],
})
export class DataComponentBase<T = any> implements ControlValueAccessor, OnChanges, Validator {
    validate(control: AbstractControl): ValidationErrors | null {
        if (control.value) {
            const keys = this.adapter().getKeysFromValue(control.value);
            const matches = this.adapter()
                .normalized()
                .filter((x) => keys.includes(x.key))
                .filter((x) => x);
            if (matches.length !== keys.length)
                return {
                    select: {
                        message: `No option found matching value`,
                    },
                };
        }
        return null;
    }

    valueChange = output<Partial<T> | Partial<T>[]>();
    required = input<boolean>(false);
    disabled = model(false);

    _ngControl = inject(NgControl, { optional: true }); // this won't cause circular dependency issue when component is dynamically created
    _control = this._ngControl?.control as UntypedFormControl; // this won't cause circular dependency issue when component is dynamically created
    _defaultControl = new FormControl();
    control = input<FormControl>(this._control ?? this._defaultControl);

    // >>>>> ControlValueAccessor ----------------------------------------
    _onChange: (value: Partial<T> | Partial<T>[]) => void;
    _onTouch: () => void;

    propagateChange() {
        this._onChange?.(this.value()); //ngModel/ngControl notify (value accessor)
    }

    markAsTouched() {
        if (this._onTouch) this._onTouch();
    }

    writeValue(v: Partial<T> | Partial<T>[]): void {
        this.value.set(v);
        this.selectionModel.clear();
        if (v != null) this.select(v);
    }

    registerOnChange(fn: (value: Partial<T> | Partial<T>[]) => void): void {
        this._onChange = fn;
    }
    registerOnTouched(fn: () => void): void {
        this._onTouch = fn;
    }
    setDisabledState?(isDisabled: boolean): void {
        this.disabled.set(isDisabled);
    }

    readonly selectedNormalized = signal<NormalizedItem<T>[]>([]);

    value = model<Partial<T> | Partial<T>[]>(undefined);

    // this property is used to store the value items in array format always
    selected = computed<Partial<T>[]>(() => {
        return (Array.isArray(this.value()) ? this.value() : this.value() != null ? [this.value()] : []) as Partial<T>[];
    });

    lazyLoadData = input(false);
    loading = signal(false);

    noDataImage = input<string>("");

    minAllowed = input<number, number | null | undefined>(0, {
        transform: (v) => Math.max(0, Math.round(Math.abs(v ?? 0))),
    });
    maxAllowed = input<number, number | null | undefined>(1, {
        transform: (v) => Math.max(1, Math.round(Math.abs(v ?? 1))),
    });

    adapter = input.required<DataAdapter<T>>();

    filterDebounceTime = input(300);

    focusedItem = model<NormalizedItem<T>>(null);
    focusedItemChange = output<NormalizedItem<T>>();
    itemClick = output<NormalizedItem<T>>();

    itemAdded = output<NormalizedItem<T>>();
    itemRemoved = output<NormalizedItem<T>>();
    itemUpdated = output<NormalizedItem<T>>();
    readonly itemsSource = signal<"adapter" | "selected">(this.lazyLoadData() ? "selected" : "adapter");

    readonly items = computed<NormalizedItem<T>[]>(() => {
        return this.itemsSource() === "adapter" ? this.adapter().normalized() : this.selectedNormalized();
    });
    constructor() {
        effect(
            () => {
                // update selectedNormalized when selected/value changes
                const keys = this.adapter().getKeysFromValue(this.selected());
                this.adapter()
                    .getItems(keys)
                    .then((items) => {
                        const ValidationErrors = this.validate(this.control());
                        if (ValidationErrors) {
                            this.control().markAsTouched();
                            this.control().setErrors(ValidationErrors);
                        }
                        this.selectedNormalized.set(items);
                    });
            },
            { allowSignalWrites: true },
        );
    }
    async loadData() {
        this.loading.set(true);
        this.adapter().refresh();
        await firstValueFrom(this.adapter().normalized$);
        this.loading.set(false);

        this.itemsSource.set("adapter");
        if (this.validate(this.control())) {
            this.control().markAsTouched();
            this.control().updateValueAndValidity();
        }
    }

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

            if (adapter.dataSource.allDataLoaded() || !this.lazyLoadData()) this.loadData();

            this.adapter().itemAdded.subscribe((item) => {
                this.itemAdded.emit(item);
            });
            this.adapter().itemRemoved.subscribe((item) => {
                this.itemRemoved.emit(item);
            });
            this.adapter().itemUpdated.subscribe((item) => {
                this.itemUpdated.emit(item);
            });
        }

        if (changes["lazyLoadData"]) {
            if (!this.lazyLoadData()) this.loadData();
        }
    }

    injector = inject(Injector);

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
    readonly selectionModel = new SelectionModel<Partial<T>>(true, []);
    toggleSelectAll() {
        //selection can have items from data from other pages or filtered data so:
        //if selected items n from this adapter data < adapter data -> select the rest
        //else unselect all items from adapter data only

        const adapter = this.adapter();
        const selected = this.selectionModel.selected;
        if (this.maxAllowed() === 1) {
            if (selected.length > 0) this.selectionModel.clear();
            this.value.set(selected[0]);
            return;
        }

        if (adapter.normalized.length === selected.length) this.selectionModel.deselect(...selected);
        else this.selectionModel.select(...adapter.normalized().map((x) => x.value));

        this.value.set(this.selectionModel.selected);
    }

    select(value: Partial<T> | Partial<T>[]) {
        const v = Array.isArray(value) ? value : [value];
        this.selectionModel.select(...v);
        this.value.set(this.selectionModel.selected);
    }

    selectAll() {
        if (this.maxAllowed() === 1) {
            this.selectionModel.clear();
            this.value.set(null);
            return;
        }
        this.selectionModel.select(
            ...this.adapter()
                .normalized()
                .map((x) => x.value),
        );

        this.value.set(this.selectionModel.selected);
    }
    deselectAll() {
        this.selectionModel.clear();
        if (this.maxAllowed() === 1) {
            this.value.set(null);
            return;
        }
        this.value.set(this.selectionModel.selected);
    }

    deselect(value: Partial<T>) {
        this.selectionModel.deselect(value);
        if (this.maxAllowed() === 1) {
            this.value.set(null);
            return;
        }
        this.value.set(this.selectionModel.selected);
    }

    toggle(value: Partial<T>) {
        if (this.selectionModel.isSelected(value)) this.deselect(value);
        else this.select(value);
    }

    setFocusedItem(row) {
        this.focusedItem.set(row);
        this.focusedItemChange.emit(row);
    }
    nextFocusedItem() {
        const normalized = this.adapter().normalized();
        const i = this.focusedItem() ? normalized.indexOf(this.focusedItem()) : -1;
        this.focusedItem.set(normalized[i + 1]);
        this.focusedItemChange.emit(this.focusedItem());
    }
    prevFocusedItem() {
        const normalized = this.adapter().normalized();

        const i = this.focusedItem() ? normalized.indexOf(this.focusedItem()) : normalized.length;
        this.focusedItem.set(normalized[i - 1]);
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
