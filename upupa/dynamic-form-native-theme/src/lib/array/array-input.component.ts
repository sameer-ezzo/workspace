import { Component, forwardRef, input, computed, Type, SimpleChanges, inject, Injector, ComponentRef } from "@angular/core";
import { NG_VALUE_ACCESSOR } from "@angular/forms";
import { ClientDataSource, DataAdapter, DataAdapterCRUDEvent } from "@upupa/data";
import { DynamicComponent, InputBaseComponent, PortalComponent } from "@upupa/common";
import { MatFormFieldModule } from "@angular/material/form-field";
import { Class } from "@noah-ark/common";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { DataTableComponent, reflectTableViewModel } from "@upupa/table";

@Component({
    selector: "array-input",
    templateUrl: "./array-input.component.html",
    imports: [PortalComponent, DataTableComponent, MatFormFieldModule],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => ArrayInputComponent),
            multi: true,
        },
        {
            provide: DataAdapter,
            useFactory: (self: ArrayInputComponent) => self.adapter,
            deps: [ArrayInputComponent],
        },
    ]
})
export class ArrayInputComponent<T = any> extends InputBaseComponent<T[]> {
    injector = inject(Injector);
    label = input("");
    // todo: pass key property (_id passed to the dataSource to identify the unique key of the data source)
    readonly dataSource = new ClientDataSource<T>([], "_id" as keyof T);
    readonly adapter = new DataAdapter<T>(this.dataSource, "_id" as keyof T, undefined, undefined, undefined, {
        page: { pageSize: Number.MAX_SAFE_INTEGER },
    });

    tableHeaderComponent = input<DynamicComponent, Type<any> | DynamicComponent>(undefined, {
        transform: (c) => {
            let template = null;
            if (c instanceof Type) template = { component: c };
            else template = c;
            template.injector = Injector.create({ providers: [{ provide: DataAdapter, useFactory: () => this.adapter }], parent: this.injector });
            return template;
        },
    });
    viewModel = input<Class>();
    columns = computed(() => {
        const vm = this.viewModel();
        if (typeof vm === "function") return reflectTableViewModel(vm)?.columns || {};
        return {};
    });

    constructor() {
        super();
        this.adapter.events.pipe(takeUntilDestroyed()).subscribe((event) => {
            if (event instanceof DataAdapterCRUDEvent) {
                this.updateValueFromDataSource();
            }
        });
    }

    updateValueFromDataSource() {
        this.handleUserInput(this.dataSource.all());
    }
    ngOnChanges(changes: SimpleChanges) {
        if (changes["value"]) {
            this.dataSource.all.set(this.value());
        }
    }
    override writeValue(value: T[]): void {
        super.writeValue(value);
        // check if the value is an array and if it is not, throw an error
        if (value && !Array.isArray(value)) {
            throw new Error("ArrayInputComponent can only be used with array values");
        }
        this.dataSource.all.set(value);
        this.adapter.refresh();
    }

    tableHeaderComponentRef: ComponentRef<any>;
    onTableHeaderAttached({ componentRef }) {
        this.tableHeaderComponentRef = componentRef;
    }
}
