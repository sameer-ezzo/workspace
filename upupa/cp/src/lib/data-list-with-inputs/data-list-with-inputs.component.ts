import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    Injector,
    OnDestroy,
    Signal,
    Type,
    ViewChild,
    computed,
    effect,
    inject,
    input,
    runInInjectionContext,
    signal,
} from "@angular/core";
import { LanguageService } from "@upupa/language";
import { AuthService } from "@upupa/auth";
import { HttpClient } from "@angular/common/http";
import { ClientDataSource, DataAdapter, DataAdapterDescriptor, DataAdapterType, DataService, HttpServerDataSource, ITableDataSource, ServerDataSource } from "@upupa/data";
import { ActivatedRoute, Router } from "@angular/router";
import { ActionEvent, EventBus } from "@upupa/common";
import { ScaffoldingService } from "../scaffolding.service";
import { DataListResolverService } from "../list-resolver.service";
import { ConfirmService, DialogService, SnackBarService } from "@upupa/dialog";
import { DataTableComponent, DataTableModule } from "@upupa/table";
import { DataListViewModel } from "./viewmodels/api-data-table-viewmodel";
import { DataListViewModelQueryParam, DataTableActionDescriptor, resolveDataListInputsFor } from "../decorators/scheme.router.decorator";
import { JsonPointer } from "@noah-ark/json-patch";

@Component({
    selector: "cp-data-list-with-inputs",
    standalone: true,
    imports: [DataTableModule],
    templateUrl: "./data-list-with-inputs.component.html",
    styleUrls: ["./data-list-with-inputs.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataListWithInputsComponent implements AfterViewInit, OnDestroy {
    public readonly injector = inject(Injector);
    public readonly auth = inject(AuthService);
    public readonly http = inject(HttpClient);
    public readonly languageService = inject(LanguageService);
    public readonly scaffolder = inject(ScaffoldingService);
    public readonly ds = inject(DataService);
    public readonly route = inject(ActivatedRoute);
    public readonly snack = inject(SnackBarService);
    public readonly bus = inject(EventBus);

    vm = computed(() => {
        const viewModel = this.viewModel();
        const inputs = resolveDataListInputsFor(viewModel);
        const adapterDescriptor = this.dataAdapterDescriptor() ?? inputs.dataAdapterDescriptor;
        let vm: DataListViewModel;

        runInInjectionContext(this.injector, () => {
            vm = new viewModel();
            vm["onInit"]?.();
        });

        vm.injector = this.injector;
        vm.component = this;
        vm.columns = inputs.columns;
        vm.inputs = inputs;

        const dataAdapterDescriptor = {
            ...adapterDescriptor,
        } as DataAdapterDescriptor<DataAdapterType>;
        if ("path" in adapterDescriptor) {
            if (typeof adapterDescriptor.path === "function") {
                dataAdapterDescriptor["path"] = adapterDescriptor.path(
                    this.route.snapshot.toString(),
                    this.route.snapshot.params,
                    this.route.snapshot.queryParams,
                    this.route.snapshot.data,
                );
            }
        }

        if ("adapterOptions" in adapterDescriptor) {
            let adapterOptions = adapterDescriptor.adapterOptions;
            if (typeof adapterOptions === "function") {
                adapterOptions = adapterOptions(this.route.snapshot.toString(), this.route.snapshot.params, this.route.snapshot.queryParams, this.route.snapshot.data);
            }
            dataAdapterDescriptor.options = adapterOptions;
        }

        vm.dataAdapter = createDataAdapter(this.injector, dataAdapterDescriptor);
        return vm;
    });

    viewModel = input.required<Type<DataListViewModel>>();
    dataAdapterDescriptor = input.required<DataAdapterDescriptor<DataAdapterType>>();

    rowActions = computed(() => (this.vm().inputs.rowActions ?? []).map((x) => x.descriptor));
    headerActions = computed(() => (this.vm().inputs.headerActions ?? []).map((x) => x.descriptor));

    private readonly router = inject(Router);
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

    async refreshData() {
        const vm = this.vm();
        if (!vm) throw new Error("ViewModel not initialized");
        const dataAdapter = vm.dataAdapter;
        if (!dataAdapter) throw new Error("DataAdapter not initialized");

        const dataSource = dataAdapter.dataSource;
        if (dataSource instanceof ServerDataSource) {
            const path = dataAdapter.dataSource["path"];
            await this.ds.refreshCache(path);
        }
        dataAdapter.refresh();
    }

    @ViewChild("dataTable") dataTable!: DataTableComponent;
    async onAction(e: ActionEvent) {
        const { name } = e.action as DataTableActionDescriptor;
        const vm = this.vm();
        if (!vm) throw new Error("ViewModel not initialized");
        if (!vm[name]) throw new Error(`Handler ${name} not found in ViewModel`);

        await vm[name]({
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
            dataTable: this.dataTable,
        });
    }
    onPageChange(event: any) {
        const vm = this.vm();
        vm.onPageChange?.(event, {
            component: this,
            dataTable: this.dataTable,
        });
    }
    onSortChange(event: any) {
        const vm = this.vm();
        vm.onSortChange?.(event, {
            component: this,
            dataTable: this.dataTable,
        });
    }

    onFocusedItemChanged($event: any) {
        const vm = this.vm();
        vm.onFocusedItemChanged?.($event, {
            component: this,
            dataTable: this.dataTable,
        });
    }
}

function createDataAdapter(
    injector: Injector,
    descriptor: DataAdapterDescriptor<DataAdapterType>, // path should be a string not a function
): DataAdapter {
    let dataSource: ITableDataSource;
    if (descriptor.type === "client") dataSource = new ClientDataSource(descriptor["data"]);
    else if (descriptor.type === "server") {
        const dataService = injector.get(DataService);
        dataSource = new ServerDataSource(dataService, descriptor["path"], []);
    } else if (descriptor.type === "http") {
        const http = injector.get(HttpClient);
        dataSource = new HttpServerDataSource(http, descriptor["url"], descriptor["httpOptions"]);
    } else throw new Error(`Invalid data adapter type ${descriptor.type}`);

    return new DataAdapter(dataSource, descriptor.keyProperty, descriptor.displayProperty, descriptor.valueProperty, descriptor.imageProperty, descriptor.options);
}
