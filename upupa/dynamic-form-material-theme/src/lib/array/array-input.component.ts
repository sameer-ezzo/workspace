import { Component, ComponentRef, computed, forwardRef, inject, Injector, input, SimpleChanges, Type } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { NG_VALUE_ACCESSOR } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { Class } from "@noah-ark/common";
import { DynamicComponent, InputBaseComponent, PortalComponent } from "@upupa/common";
import { ClientDataSource, DataAdapter, DataAdapterCRUDEvent, NormalizedItem } from "@upupa/data";

import { DataTableComponent, reflectTableViewModel } from "@upupa/table";

@Component({
    selector: "mat-form-array-input",
    templateUrl: "./array-input.component.html",
    imports: [DataTableComponent, PortalComponent, MatFormFieldModule, MatInputModule],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MatArrayInputComponent),
            multi: true,
        },
        {
            provide: DataAdapter,
            useFactory: (self: MatArrayInputComponent) => self.adapter,
            deps: [MatArrayInputComponent],
        },
    ],
})
export class MatArrayInputComponent<T = any> extends InputBaseComponent<T[]> {
    injector = inject(Injector);
    label = input("");
    rowClass = input<(item: NormalizedItem<T>) => string>((item) => (item.key ?? item).toString());

    // todo: pass key property (_id passed to the dataSource to identify the unique key of the data source)
    readonly dataSource = new ClientDataSource<T>([], "_id" as keyof T);
    readonly adapter = new DataAdapter<T>(this.dataSource, "_id" as keyof T, undefined, undefined, undefined, {
        page: { pageSize: Number.MAX_SAFE_INTEGER },
        autoRefresh: true,
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
    override async ngOnChanges(changes: SimpleChanges) {
        await super.ngOnChanges(changes);
        if (changes["value"]) {
            this.dataSource.all = this.value();
            this.adapter.refresh();
        }
    }
    override writeValue(value: T[]): void {
        super.writeValue(value);
        // check if the value is an array and if it is not, throw an error
        if (value && !Array.isArray(value)) {
            throw new Error("ArrayInputComponent can only be used with array values");
        }
        this.dataSource.all = value;
        this.adapter.refresh();
    }

    tableHeaderComponentRef: ComponentRef<any>;
    onTableHeaderAttached({ componentRef }) {
        this.tableHeaderComponentRef = componentRef;
    }
}
