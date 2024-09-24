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
import { ActionEvent, EventBus } from '@upupa/common';
import { ScaffoldingService } from '../scaffolding.service';
import { DataListResolverService } from '../list-resolver.service';
import { ConfirmService, DialogService, SnackBarService } from '@upupa/dialog';
import { DataTableComponent } from '@upupa/table';
import { DataListViewModel } from './viewmodels/api-data-table-viewmodel';
import {
  DataTableActionDescriptor,
  resolveDataListInputsFor,
} from '../decorators/scheme.router.decorator';

@Component({
  selector: 'cp-data-list-with-inputs',
  templateUrl: './data-list-with-inputs.component.html',
  styleUrls: ['./data-list-with-inputs.component.scss'],
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


  inputs = computed(() => {
    const viewModel = this.viewModel();
    const inputs = resolveDataListInputsFor(viewModel);

    return inputs;
  });
  vm = computed(() => {
    const inputs = this.inputs();
    const viewModel = this.viewModel();
    const vm = new viewModel();
    vm.injector = this.injector;
    vm.component = this;
    vm.inputs = inputs;
    const dataAdapterDescriptor = { ...inputs.dataAdapterDescriptor };
    if ('path' in inputs.dataAdapterDescriptor) {
      if (typeof inputs.dataAdapterDescriptor.path === 'function') {
        dataAdapterDescriptor['path'] = inputs.dataAdapterDescriptor.path(
          this.route.snapshot.toString(),
          this.route.snapshot.params,
          this.route.snapshot.queryParams,
          this.route.snapshot.data
        );
      }
    }

    if ('adapterOptions' in inputs.dataAdapterDescriptor) {
      let adapterOptions = inputs.dataAdapterDescriptor.adapterOptions;
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

    vm.dataAdapter = this.createDataAdapter(dataAdapterDescriptor);
    vm.columns = inputs.columns;
    return vm;
  });
  viewModel = input.required<Type<DataListViewModel>>();

  rowActions = computed(() =>
    (this.inputs().rowActions ?? []).map((x) => x.descriptor)
  );
  headerActions = computed(() =>
    (this.inputs().headerActions ?? []).map((x) => x.descriptor)
  );

  private createDataAdapter(
    descriptor: DataAdapterDescriptor<DataAdapterType>
  ): DataAdapter {
    let dataSource: ITableDataSource;
    if (descriptor.type === 'client') {
      dataSource = new ClientDataSource(descriptor['data']);
    } else if (descriptor.type === 'server') {
      dataSource = new ServerDataSource(this.ds, descriptor['path'], []);
    } else if (descriptor.type === 'http') {
      dataSource = new HttpServerDataSource(
        this.http,
        descriptor['url'],
        descriptor['httpOptions']
      );
    } else {
      throw new Error(`Invalid data adapter type ${descriptor.type}`);
    }

    return new DataAdapter(
      dataSource,
      descriptor.keyProperty,
      descriptor.displayProperty,
      descriptor.valueProperty,
      descriptor.imageProperty,
      descriptor.options
    );
  }

  // dataAdapterDescriptor = input<DataAdapterDescriptor<DataAdapterType>>();
  // columns = input<ColumnsDescriptor>();
  // headerActions = input<
  //   ActionDescriptor[] | ((rows: any[]) => ActionDescriptor[])
  // >();
  // rowActions = input<ActionDescriptor[] | ((row: any) => ActionDescriptor[])>();
  // query?: (...deps: any[]) => Record<string, string | string[]>;
  // queryParams?: (...deps: any[]) => Record<string, string | string[]>;

  async ngAfterViewInit() {}
  ngOnDestroy() {}

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
    const { handlerName } = e.action as DataTableActionDescriptor;
    const vm = this.vm();
    if (!vm) throw new Error('ViewModel not initialized');
    if (!vm[handlerName])
      throw new Error(`Handler ${handlerName} not found in ViewModel`);

    await vm[handlerName]({
      ...e,
      context: { ...e.context, component: this, dataTable: this.dataTable },
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
