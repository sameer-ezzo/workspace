import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    Injector,
    OnDestroy,
    Type,
    computed,
    inject,
    input,
    model,
    output,
    runInInjectionContext,
    viewChild,
} from "@angular/core";
import { createDataAdapter, DataAdapter, DataAdapterDescriptor, DataAdapterType } from "@upupa/data";
import { ActivatedRoute } from "@angular/router";
import { DynamicComponent, PortalComponent } from "@upupa/common";

import { CommonModule } from "@angular/common";
import { Class } from "@noah-ark/common";
import { DataTableComponent } from "../data-table.component";
import { reflectTableViewModel } from "../decorator";

@Component({
    selector: "data-list",
    standalone: true,
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
    ],
})
export class DataListComponent implements AfterViewInit, OnDestroy {
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

    dataAdapter = input.required<DataAdapter, DataAdapter | DataAdapterDescriptor<DataAdapterType>>({
        transform: (adapterOrDescriptor) => {
            if (adapterOrDescriptor instanceof DataAdapter) {
                return adapterOrDescriptor;
            }
            return createDataAdapter(adapterOrDescriptor, this.injector);
        },
    });

    dataTable = viewChild(DataTableComponent);

    columns = computed(() => reflectTableViewModel(this.viewModel()).columns);
    instance: Class;
    // vm = computed(() => {
    //     const viewModel = this.viewModel();

    //     runInInjectionContext(this.injector, () => {
    //         this.instance = new viewModel();
    //         this.instance["onInit"]?.();
    //     });

    //     return this.instance;
    // });

    async ngAfterViewInit() {
        await this.instance?.["afterViewInit"]?.();
    }

    async ngOnDestroy() {
        await this.instance?.["onDestroy"]?.();
    }

    onSelectionChange(event: any) {
        // const vm = this.vm();
        // if ('onSelect' in vm) {
        //     runInInjectionContext(this.injector, () => {
        //         vm['onSelect'](event);
        //     });
        // }
    }
    onPageChange(event: any) {
        // const vm = this.vm();
        // runInInjectionContext(this.injector, () => {
        //     vm.onPageChange?.(event);
        // });
    }
    onSortChange(event: any) {
        // const vm = this.vm();
        // runInInjectionContext(this.injector, () => {
        //     vm.onSort?.(event);
        // });
    }

    focusedItem = model();
    onFocusedItemChanged($event: any) {
        runInInjectionContext(this.injector, () => {
            this.focusedItem.set($event);
        });
    }
}
