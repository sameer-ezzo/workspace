import { AfterViewInit, ChangeDetectionStrategy, Component, Injector, OnDestroy, SimpleChanges, Type, computed, inject, input } from "@angular/core";
import { createDataAdapter, DataAdapter, DataAdapterDescriptor } from "@upupa/data";
import { ActivatedRoute } from "@angular/router";
import { _defaultControl, DynamicComponent, PortalComponent } from "@upupa/common";
import { CommonModule } from "@angular/common";
import { Class } from "@noah-ark/common";
import { MatTableModule } from "@angular/material/table";
import { TableViewModelMirror, reflectTableViewModel } from "../decorator";
import { ColumnDescriptor, ColumnsDescriptorStrict } from "../types";
import { DefaultTableCellTemplate } from "../cell-template-component";
import { JsonPointerPipe } from "../json-pointer.pipe";
import { MatProgressBar } from "@angular/material/progress-bar";
import { DynamicPipe } from "../dynamic.pipe";

@Component({
    selector: "table-view",
    imports: [CommonModule, PortalComponent, DefaultTableCellTemplate, JsonPointerPipe, MatProgressBar, MatTableModule],
    templateUrl: "./table-view.component.html",
    styleUrls: ["./table-view.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: DataAdapter,
            useFactory: (component: TableViewComponent) => component.adapter(),
            deps: [TableViewComponent],
        },
    ],
})
export class TableViewComponent {
    readonly injector = inject(Injector);
    readonly route = inject(ActivatedRoute);

    tableHeaderComponent = input<DynamicComponent, Type<any> | DynamicComponent>(undefined, {
        transform: (c) => {
            if (c instanceof Type) return { component: c };
            return c;
        },
    });

    viewModel = input.required<Class | TableViewModelMirror>();
    showPaginator = input(false);

    adapter = input.required<DataAdapter, DataAdapter | DataAdapterDescriptor>({
        transform: (adapterOrDescriptor) => {
            if (adapterOrDescriptor instanceof DataAdapter) {
                return adapterOrDescriptor;
            }
            return createDataAdapter(adapterOrDescriptor, this.injector);
        },
    });

    columns = computed(() => {
        const vm = this.viewModel();
        const mirror = typeof vm === "function" ? reflectTableViewModel(vm) : vm;
        return Object.fromEntries(mirror.columns as [string, ColumnDescriptor][]) as ColumnsDescriptorStrict;
    });
    columnNames = computed(() => Object.keys(this.columns()));

    ngOnChanges(changes: SimpleChanges) {
        if (changes["adapter"]) {
            this.adapter().load();
        }
    }

    trackByFn(index, item) {
        return item.key;
    }

    getRowInjector(element: any) {
        return undefined;
    }

    merge(inputs: any, inp2: any) {
        return {
            ...inputs,
            ...inp2,
        };
    }
}
