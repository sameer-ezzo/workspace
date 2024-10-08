import { AfterViewInit, ChangeDetectionStrategy, Component, Injector, OnDestroy, Type, ViewChild, computed, inject, input, runInInjectionContext, viewChild } from "@angular/core";
import { createDataAdapter, DataAdapter, DataAdapterDescriptor, DataAdapterType } from "@upupa/data";
import { ActivatedRoute } from "@angular/router";
import { ActionDescriptor, ActionEvent } from "@upupa/common";
import { DataTableComponent, DataTableModule } from "@upupa/table";
import { DataListAction, DataListViewModel } from "./viewmodels/api-data-table-viewmodel";
import { DataListViewModelQueryParam, resolveDataListInputsFor } from "../decorators/scheme.router.decorator";

@Component({
    selector: "cp-data-list-with-inputs",
    standalone: true,
    imports: [DataTableModule],
    templateUrl: "./data-list-with-inputs.component.html",
    styleUrls: ["./data-list-with-inputs.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataListWithInputsComponent implements AfterViewInit, OnDestroy {
    readonly injector = inject(Injector);
    readonly route = inject(ActivatedRoute);

    viewModel = input.required<Type<DataListViewModel>>();

    dataAdapter = input.required<DataAdapter, DataAdapter | DataAdapterDescriptor<DataAdapterType>>({
        transform: (adapterOrDescriptor) => {
            if (adapterOrDescriptor instanceof DataAdapter) {
                return adapterOrDescriptor;
            }
            return createDataAdapter(adapterOrDescriptor, this.injector);
        },
    });

    rowActions = input<ActionDescriptor[] | ((context: any) => ActionDescriptor)[], DataListAction[]>([], {
        transform: (actionsFromInput) => this.transformActions(actionsFromInput),
    });
    headerActions = input<ActionDescriptor[] | ((context: any) => ActionDescriptor)[], DataListAction[]>([], {
        transform: (actionsFromInput) => this.transformActions(actionsFromInput),
    });

    dataTable = viewChild(DataTableComponent);

    vm = computed(() => {
        const viewModel = this.viewModel();
        const inputs = resolveDataListInputsFor(viewModel);
        let vm: DataListViewModel;

        runInInjectionContext(this.injector, () => {
            vm = new viewModel();
            vm["onInit"]?.();
        });

        vm.injector = this.injector;
        vm.component = this;
        vm.columns = inputs.columns ?? {};
        vm.inputs = inputs;

        vm.dataAdapter = this.dataAdapter();
        return vm;
    });

    private transformActions(actionsFromInput): ActionDescriptor[] | ((context: any) => ActionDescriptor)[] {
        const info = (actionsFromInput ?? []).map((x) => {
            const a = typeof x.action === "function" ? x.action : (items) => x.action;
            return (item) => {
                const res = a(item);
                return !res ? res : { ...res, handler: x.handler };
            };
        });
        return info as ActionDescriptor[] | ((context: any) => ActionDescriptor)[];
    }

    async ngOnInit() {
        const vm = this.vm();
        await vm?.["onInit"]?.();
    }

    async ngAfterViewInit() {
        const vm = this.vm();
        await vm?.["afterViewInit"]?.();
        if (vm.inputs.queryParams) {
            const vmQps: DataListViewModelQueryParam[] = vm.inputs.queryParams;
            this.route.queryParams.subscribe((params) => {
                const qps = vmQps
                    .filter((qp) => params[qp.param])
                    .map((qp) => ({ [qp.param]: params[qp.param] }))
                    .reduce((acc, qp) => ({ ...acc, ...qp }), {});
                vm.dataAdapter.filter = { ...vm.dataAdapter.filter, ...qps };
            });
        }
    }

    async ngOnDestroy() {
        await this.vm()?.["onDestroy"]?.();
    }

    async onAction(e: ActionEvent) {
        // const { name } = e.action as DataTableActionDescriptor;
        // const vm = this.vm();
        // if (!vm) throw new Error('ViewModel not initialized');
        // if (!vm[name])
        //     throw new Error(`Handler ${name} not found in ViewModel`);

        const a = e.action;
        await a["handler"]?.({
            ...e,
            context: {
                ...e.context,
                component: this,
                dataTable: this.dataTable,
            },
        });
    }

    onSelectionChange(event: any) {
        const vm = this.vm();
        vm.onSelectionChange?.(event, {
            component: this,
            dataTable: this.dataTable(),
        });
    }
    onPageChange(event: any) {
        const vm = this.vm();
        vm.onPageChange?.(event, {
            component: this,
            dataTable: this.dataTable(),
        });
    }
    onSortChange(event: any) {
        const vm = this.vm();
        vm.onSortChange?.(event, {
            component: this,
            dataTable: this.dataTable(),
        });
    }

    onFocusedItemChanged($event: any) {
        const vm = this.vm();
        vm.onFocusedItemChanged?.($event, {
            component: this,
            dataTable: this.dataTable(),
        });
    }
}
