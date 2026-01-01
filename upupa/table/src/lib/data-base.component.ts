import { Component, Injector, OnChanges, SimpleChanges, computed, inject, input, model, output } from "@angular/core";
import { PageEvent } from "@angular/material/paginator";
import { Sort } from "@angular/material/sort";
import { DataAdapter, NormalizedItem } from "@upupa/data";
import { AbstractControl, AsyncValidator, ControlValueAccessor, FormControl, NgControl, UntypedFormControl, ValidationErrors } from "@angular/forms";
import { _defaultControl } from "@upupa/common";
import { filter, firstValueFrom, Observable } from "rxjs";
import { toObservable } from "@angular/core/rxjs-interop";
import { BooleanInput } from "@angular/cdk/coercion";

function compareObjectWithFn(keyProperty: any) {
    return (optVal: any, selectVal: any) => {
        const oType = typeof optVal;
        const sType = typeof selectVal;
        if (oType !== sType) {
            console.warn(`Type mismatch: ${oType} !== ${sType}`, { option: optVal, value: selectVal });
            return false;
        }
        if (optVal === selectVal) return true;
        if (optVal == undefined || selectVal == undefined) return false;
        return oType == "object" ? optVal[keyProperty] === selectVal[keyProperty] : false;
    };
}

function compareWithFn(optVal: any, selectVal: any) {
    const oType = typeof optVal;
    const sType = typeof selectVal;
    if (oType !== sType) {
        console.warn(`Type mismatch: ${oType} !== ${sType}`, { option: optVal, value: selectVal });
        return false;
    }
    return optVal === selectVal;
}

@Component({
    template: "",
    providers: [], // base component cannot pass providers to child components
})
export class DataComponentBase<T = any> implements ControlValueAccessor, OnChanges, AsyncValidator {
    async validate(control: AbstractControl): Promise<Promise<ValidationErrors | null> | Observable<ValidationErrors | null>> {
        if (!control.value) return Promise.resolve(null);

        if (this.adapter().loading()) {
            await firstValueFrom(toObservable(this.adapter().loading).pipe(filter((x) => !x)));
        }

        const keys = this.adapter().getKeysFromValue(control.value);
        const matches = this.adapter().selection();

        if (matches.length !== keys.length) {
            console.error(`Validation error: ${this.control.name} No option found matching value`, keys, matches);
            return {
                select: {
                    message: `No option found matching value`,
                },
            };
        }

        return undefined;
    }

    valueChange = output<Partial<T> | Partial<T>[]>();
    required = input<boolean>(false);
    disabled = model(false);
    multiple = input<boolean, BooleanInput>(true, { transform: (v) => v === true || v === "" || v === "true" || v === undefined });

    _ngControl = inject(NgControl, { optional: true }); // this won't cause circular dependency issue when component is dynamically created
    _control = this._ngControl?.control as UntypedFormControl; // this won't cause circular dependency issue when component is dynamically created
    _defaultControl = _defaultControl(this);
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
        if (v === this.value()) return;
        if (v == null) {
            this.adapter().unselectAll();
            this.value.set(null);
        } else {
            const value = Array.isArray(v) ? v : [v];
            this.select(value, { clearSelection: true, emitEvent: false });
        }
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

    value = model<Partial<T> | Partial<T>[]>(undefined);

    lazyLoadData = input(false);

    noDataImage = input<string>("");
    noDataMessage = input<string>("No data found");

    adapter = input.required<DataAdapter<T>>();

    filterDebounceTime = input(300);

    focusedItem = model<T>(null);
    itemClick = output<NormalizedItem<T>>();

    readonly items = computed<NormalizedItem<T>[]>(() => this.adapter().normalized());
    readonly isSelected = computed<NormalizedItem<T>[]>(() => this.adapter().selection());
    readonly notSelected = computed<NormalizedItem<T>[]>(() => this.items().filter((x) => !x.selected));

    _firstLoad = false;
    async loadData() {
        if (this._firstLoad) return;
        await this.adapter().refresh();
        this._firstLoad = true;
    }

    compareWithFn = compareWithFn;

    async ngOnChanges(changes: SimpleChanges) {
        if (changes["adapter"]) {
            this._firstLoad = false;
            const adapter = this.adapter();
            if (!adapter) throw new Error("Adapter is required");

            const keyProperty = adapter?.keyProperty;

            this.compareWithFn = keyProperty && Array.isArray(adapter?.valueProperty) ? compareObjectWithFn(keyProperty) : compareWithFn;

            if (!this.lazyLoadData()) await this.loadData();
        }

        if (changes["lazyLoadData"]) {
            if (!this.lazyLoadData()) await this.loadData();
        }

        if (changes["value"]) {
            this.adapter().unselectAll();
            const value = this.value();
            const v = Array.isArray(value) ? value : [value];
            this.select(v);
        }

        if (changes["disabled"]) {
            const isDisabled = this.disabled(); // if required is false, we consider it as disabled
            if (isDisabled) {
                this._ngControl.control?.disable({ emitEvent: false });
            } else {
                this._ngControl.control?.enable({ emitEvent: false });
            }
        }
    }

    injector = inject(Injector);

    pageChange = output<PageEvent>();
    async goto(page: PageEvent) {
        await this.adapter().load({ page });
        this.pageChange.emit(page);
    }

    sortChange = output<Sort>();
    async sort(by: Sort) {
        await this.adapter().load({ sort: by });
        this.sortChange.emit(by);
    }

    select(value: Partial<T>[], options: { clearSelection?: boolean; emitEvent?: boolean } = { clearSelection: false, emitEvent: true }) {
        value ??= [];

        if (this.multiple()) {
            if (options?.clearSelection) this.value.set(value);
            else this.value.update((oldValue: Partial<T>[]) => [...(oldValue ?? []), ...value]);
            this.adapter().select(value, { clearSelection: options?.clearSelection });
        } else {
            const v = Array.isArray(value) ? value[0] : value;
            this.value.set(v);
            this.adapter().select([v], { clearSelection: true });
        }

        if (options?.emitEvent) {
            this.markAsTouched();
            this.propagateChange();
        }
    }

    async unselect(value: Partial<T>[]) {
        if (!value?.length) return;
        if (this.multiple()) {
            this.adapter().unselect(value);
            this.value.set(
                this.adapter()
                    .selection()
                    .map((x) => x.value),
            );
        } else {
            this.adapter().unselectAll();
            this.value.set(null);
        }

        this.markAsTouched();
        this.propagateChange();
    }

    selectAll() {
        this.markAsTouched();
        this.propagateChange();
        if (!this.multiple()) return;
        this.adapter().selectAll();
        this.value.set(
            this.adapter()
                .selection()
                .map((x) => x.value),
        );
    }
    unselectAll() {
        this.markAsTouched();
        this.propagateChange();
        this.adapter().unselectAll();
        if (this.multiple()) this.value.set([]);
        else this.value.set(null);
    }

    toggleSelectAll() {
        if (this.adapter().selection().length > 0) this.unselectAll();
        else this.selectAll();
    }

    toggle(...value: Partial<T>[]) {
        if (!value) return;
        if (this.multiple()) {
            this.adapter().toggle(value);
            this.value.set(
                this.adapter()
                    .selection()
                    .map((x) => x.value),
            );
        } else {
            this.adapter().unselectAll();
            const v = Array.isArray(value) ? value[0] : value;
            this.adapter().toggle(v);
            this.value.set(v);
        }

        this.markAsTouched();
        this.propagateChange();
    }

    nextFocusedItem() {
        const normalized = this.adapter().normalized();
        const i = this.focusedItem() ? normalized.findIndex((e) => e.item === this.focusedItem()) : -1;
        if (i > -1) this.focusedItem.set(normalized[i + 1].item);
    }
    prevFocusedItem() {
        const normalized = this.adapter().normalized();
        const i = this.focusedItem() ? normalized.findIndex((e) => e.item === this.focusedItem()) : -1;
        if (i > 0) this.focusedItem.set(normalized[i - 1].item);
    }

    onLongPress(row: NormalizedItem<T>) {
        this.focusedItem.set(row.item);
        this.toggle(row.value);
        this.longPressed = row; //to notify click about it
    }
    longPressed: NormalizedItem<T>;

    onClick(row: NormalizedItem<T>) {
        this.focusedItem.set(row.item);

        if (this.longPressed) this.select(row.key);
        else {
            if (this.adapter().selection().length > 0) this.toggle(row.value);
            else
                this.itemClick.emit(
                    this.adapter()
                        .normalized()
                        .find((e) => e.item === this.focusedItem()),
                );
        }

        this.longPressed = null; //clear long press notification
    }
}
