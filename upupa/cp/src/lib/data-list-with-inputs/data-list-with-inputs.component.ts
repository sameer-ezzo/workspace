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
} from '@angular/core';
import { LanguageService } from '@upupa/language';
import { AuthService } from '@upupa/auth';
import { HttpClient } from '@angular/common/http';
import {
    ClientDataSource,
    DataAdapter,
    DataAdapterDescriptor,
    DataAdapterType,
    DataService,
    HttpServerDataSource,
    ITableDataSource,
    ServerDataSource,
} from '@upupa/data';
import { ActivatedRoute, Router } from '@angular/router';
import { ActionDescriptor, ActionEvent, EventBus } from '@upupa/common';
import { ScaffoldingService } from '../scaffolding.service';
import { DataListResolverService } from '../list-resolver.service';
import { ConfirmService, DialogService, SnackBarService } from '@upupa/dialog';
import { DataTableComponent, DataTableModule } from '@upupa/table';
import {
    DataListAction,
    DataListViewModel,
    DataListViewModelActionContext,
} from './viewmodels/api-data-table-viewmodel';
import {
    DataListViewModelQueryParam,
    DataTableActionDescriptor,
    resolveDataListInputsFor,
} from '../decorators/scheme.router.decorator';
import { JsonPointer } from '@noah-ark/json-patch';
import { unreachable } from '@noah-ark/common';

@Component({
    selector: 'cp-data-list-with-inputs',
    standalone: true,
    imports: [DataTableModule],
    templateUrl: './data-list-with-inputs.component.html',
    styleUrls: ['./data-list-with-inputs.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataListWithInputsComponent implements AfterViewInit, OnDestroy {
    viewModel = input.required<Type<DataListViewModel>>();
    dataAdapterDescriptor =
        input.required<DataAdapterDescriptor<DataAdapterType>>();

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
        const adapterDescriptor =
            this.dataAdapterDescriptor() ?? inputs.dataAdapterDescriptor;
        let vm: DataListViewModel;

        runInInjectionContext(this.injector, () => {
            vm = new viewModel();
            vm['onInit']?.();
        });

        vm.injector = this.injector;
        vm.component = this;
        vm.columns = inputs.columns ?? {};
        vm.inputs = inputs;

        const dataAdapterDescriptor = {
            ...adapterDescriptor,
        } as DataAdapterDescriptor<DataAdapterType>;
        if ('path' in adapterDescriptor) {
            if (typeof adapterDescriptor.path === 'function') {
                // TODO @samir why is this a function?
                dataAdapterDescriptor['path'] = adapterDescriptor.path(
                    this.route.snapshot.toString(),
                    this.route.snapshot.params,
                    this.route.snapshot.queryParams,
                    this.route.snapshot.data
                );
            }
        }

        if ('adapterOptions' in adapterDescriptor) {
            let adapterOptions = adapterDescriptor.adapterOptions;
            if (typeof adapterOptions === 'function') {
                adapterOptions = adapterOptions(
                    this.route.snapshot.toString(),
                    this.route.snapshot.params,
                    this.route.snapshot.queryParams,
                    this.route.snapshot.data
                );
            }
            dataAdapterDescriptor.options = adapterOptions;
        }

        vm.dataAdapter = createDataAdapter(
            this.injector,
            dataAdapterDescriptor
        );
        return vm;
    });
    private transformActions(
        actionsFromInput
    ): ActionDescriptor[] | ((context: any) => ActionDescriptor)[] {
        const info = (actionsFromInput ?? []).map((x) => {
            const a =
                typeof x.action === 'function' ? x.action : (items) => x.action;
            return (item) => {
                const res = a(item);
                return !res ? res : { ...res, handler: x.handler };
            };
        });
        return info as
            | ActionDescriptor[]
            | ((context: any) => ActionDescriptor)[];
    }
    rowActions = input<
        ActionDescriptor[] | ((context: any) => ActionDescriptor)[],
        DataListAction[]
    >([], {
        transform: (actionsFromInput) =>
            this.transformActions(actionsFromInput),
    });
    headerActions = input<
        ActionDescriptor[] | ((context: any) => ActionDescriptor)[],
        DataListAction[]
    >([], {
        transform: (actionsFromInput) =>
            this.transformActions(actionsFromInput),
    });

    private readonly router = inject(Router);
    async ngOnInit() {
        const vm = this.vm();
        await vm?.['onInit']?.();
    }

    async ngAfterViewInit() {
        const vm = this.vm();
        await vm?.['afterViewInit']?.();
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
        await this.vm()?.['onDestroy']?.();
    }

    async refreshData() {
        const vm = this.vm();
        if (!vm) throw new Error('ViewModel not initialized');
        const dataAdapter = vm.dataAdapter;
        if (!dataAdapter) throw new Error('DataAdapter not initialized');

        const dataSource = dataAdapter.dataSource;
        if (dataSource instanceof ServerDataSource) {
            const path = dataAdapter.dataSource['path'];
            await this.ds.refreshCache(path);
        }
        dataAdapter.refresh();
    }

    @ViewChild('dataTable') dataTable!: DataTableComponent;
    async onAction(e: ActionEvent) {
        // const { name } = e.action as DataTableActionDescriptor;
        // const vm = this.vm();
        // if (!vm) throw new Error('ViewModel not initialized');
        // if (!vm[name])
        //     throw new Error(`Handler ${name} not found in ViewModel`);

        const a = e.action;
        await a['handler']?.({
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
    descriptor: DataAdapterDescriptor<DataAdapterType> // path should be a string not a function
): DataAdapter {
    let dataSource: ITableDataSource;

    switch (descriptor.type) {
        case 'client':
            dataSource = new ClientDataSource(descriptor['data']);
            break;
        case 'server':
            const dataService = injector.get(DataService);
            dataSource = new ServerDataSource(
                dataService,
                descriptor['path'] as any,
                []
            );
            break;
        case 'http':
            const http = injector.get(HttpClient);
            dataSource = new HttpServerDataSource(
                http,
                descriptor['url'],
                descriptor['httpOptions']
            );
            break;
        default:
            throw unreachable('data adapter type:', descriptor);
    }

    // throw new Error(`Invalid data adapter type ${descriptor.type}`);

    return new DataAdapter(
        dataSource,
        descriptor.keyProperty,
        descriptor.displayProperty,
        descriptor.valueProperty,
        descriptor.imageProperty,
        descriptor.options
    );
}
