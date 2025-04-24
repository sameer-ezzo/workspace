import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    Injector,
    OnDestroy,
    Type,
    computed,
    forwardRef,
    inject,
    input,
    model,
    runInInjectionContext,
    viewChild,
} from "@angular/core";
import { createDataAdapter, DataAdapter, DataAdapterDescriptor } from "@upupa/data";
import { ActivatedRoute } from "@angular/router";
import { _defaultControl, DynamicComponent, PortalComponent } from "@upupa/common";

import { CommonModule } from "@angular/common";
import { Class } from "@noah-ark/common";
import { DataTableComponent } from "../data-table.component";
import { reflectTableViewModel } from "../decorator";
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, NgControl, UntypedFormControl } from "@angular/forms";

@Component({
    selector: "data-list",
    imports: [CommonModule, PortalComponent, DataTableComponent],
    templateUrl: "./data-list.component.html",
    styleUrls: ["./data-list.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: DataAdapter,
            useFactory: (component) => component.dataAdapter(),
            deps: [DataListComponent],
        },
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => DataListComponent),
            multi: true,
        },
    ],
})
export class DataListComponent<T = any[]> implements AfterViewInit, OnDestroy, ControlValueAccessor {
    readonly injector = inject(Injector);
    readonly route = inject(ActivatedRoute);

    tableHeaderComponent = input<DynamicComponent, Type<any> | DynamicComponent>(undefined, {
        transform: (c) => {
            if (c instanceof Type) return { component: c };
            return c;
        },
    });

    viewModel = input.required<Class>();
    expandable = input<"single" | "multi" | "none">("single");
    expandableComponent = input<DynamicComponent, Type<any> | DynamicComponent>(undefined, {
        transform: (c) => {
            if (c instanceof Type) return { component: c };
            return c;
        },
    });

    dataAdapter = input.required<DataAdapter, DataAdapter | DataAdapterDescriptor>({
        transform: (adapterOrDescriptor) => {
            if (adapterOrDescriptor instanceof DataAdapter) {
                return adapterOrDescriptor;
            }
            return createDataAdapter(adapterOrDescriptor, this.injector);
        },
    });

    dataTable = viewChild(DataTableComponent);

    secondaryRows = computed(() => reflectTableViewModel(this.viewModel()).secondaryRows);
    columns = computed(() => reflectTableViewModel(this.viewModel()).columns);
    instance: Class;

    async ngAfterViewInit() {
        await this.instance?.["afterViewInit"]?.();
    }

    async ngOnDestroy() {
        await this.instance?.["onDestroy"]?.();
    }

    onSelectionChange(event: any) {
        this.handleUserInput(this.dataTable().value() as any);
    }
    onPageChange(event: any) {}
    onSortChange(event: any) {
        // this should reflect the sorting in the selected items as well as the data table
    }

    focusedItem = model();
    onFocusedItemChanged($event: any) {
        runInInjectionContext(this.injector, () => {
            this.focusedItem.set($event);
        });
    }

    // >>>>> ControlValueAccessor ----------------------------------------

    name = input<string, string>(`field_${Date.now()}`, {
        alias: "fieldName",
        transform: (v) => {
            return v ? v : `field_${Date.now()}`;
        },
    });
    disabled = model(false);
    required = input(false);

    value = model<T>();
    _ngControl = inject(NgControl, { optional: true }); // this won't cause circular dependency issue when component is dynamically created
    _control = this._ngControl?.control as UntypedFormControl; // this won't cause circular dependency issue when component is dynamically created
    _defaultControl = _defaultControl(this);
    control = input<FormControl>(this._control ?? this._defaultControl);
    handleUserInput(v: T) {
        this.value.set(v);

        if (this._ngControl) {
            // only notify changes if control was provided externally
            this.markAsTouched();
            this.propagateChange();
        } else {
            const control = this.control();
            if (control?.value !== v) control.setValue(v);
        }
    }

    _onChange: (value: T) => void;
    _onTouch: () => void;

    propagateChange() {
        this._onChange?.(this.value());
    }

    markAsTouched() {
        if (this._onTouch) this._onTouch();
    }

    writeValue(v: T): void {
        this.value.set(v);
    }

    registerOnChange(fn: (value: T) => void): void {
        this._onChange = fn;
    }
    registerOnTouched(fn: () => void): void {
        this._onTouch = fn;
    }
    setDisabledState?(isDisabled: boolean): void {
        this.disabled.set(isDisabled);
    }
}
