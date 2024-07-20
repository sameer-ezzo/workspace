import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, Injector, Input, OnDestroy, ViewChild, inject, signal } from "@angular/core";
import { languageDir, LanguageService } from "@upupa/language";
import { ActionDescriptor, ActionEvent, ConfirmOptions, toTitleCase } from "@upupa/common";
import { AuthService } from "@upupa/auth";
import { HttpClient } from "@angular/common/http";
import { DataService, FilterDescriptor, ServerDataSource } from "@upupa/data";
import { Observable } from "rxjs";
import { ActivatedRoute, Params, Router } from "@angular/router";
import { DialogService, SnackBarService } from "@upupa/common";
import { ConfirmService } from "@upupa/common";
import { EventBus } from "@upupa/common";
import { ScaffoldingService } from "../scaffolding.service";
import {
    DataListFilterForm,
    DataListResolverResult,
} from "../../types";
import { PathInfo } from "@noah-ark/path-matcher";
import { DataListResolverService } from "../list-resolver.service";

import { DataFilterFormComponent, formSchemeToDynamicFormFilter } from "../data-filter-form/data-filter-form.component";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
    selector: "cp-data-list",
    templateUrl: "./data-list.component.html",
    styleUrls: ["./data-list.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataListComponent implements AfterViewInit, OnDestroy {

    private readonly destroyRef = inject(DestroyRef)
    private _filterFormValue: any;
    private _listViewModelActions: ActionDescriptor[] | ((row: any) => ActionDescriptor[]);
    dataTableActions: ActionDescriptor[] | ((row: any) => ActionDescriptor[]);
    public get filterFormValue(): any {
        return this._filterFormValue;
    }
    public set filterFormValue(value: any) {
        if (value === this._filterFormValue) return;
        this._filterFormValue = value;
    }

    filterFormVm: DataListFilterForm
    latestFilterFormStrValue = null

    item: any;
    focusedItem: any;
    selection = [];


    @ViewChild("filterDrawer") filterDrawer: any;

    private _collection: string;
    @Input()
    public get collection(): string {
        return this._collection;
    }
    public set collection(value: string) {
        if (value === this._collection) return;
        this._collection = value;
        this.listService.resolve(this.collection, 'list', undefined).then(r => this.dataListResolverResult = r)
    }

    filterButtonActionDescriptor = { action: 'filter', icon: 'filter_list', header: true, variant: 'icon', handler: (event: ActionEvent) => this.toggleFilterDrawer() } as ActionDescriptor

    _dataListResolverResult = signal<DataListResolverResult<any>>(null)
    @Input()
    public get dataListResolverResult(): DataListResolverResult<any> {
        return this._dataListResolverResult();
    }
    public set dataListResolverResult(value: DataListResolverResult<any>) {
        if (!value) return
        this._dataListResolverResult.set(value);

        //todo: make sure to call this only if no filter provided.
        value.adapter.refresh()

        const { page, per_page, sort_by } = this.route.snapshot.queryParams
        if (page) value.adapter.page.pageIndex = +page - 1
        if (per_page) value.adapter.page.pageSize = +per_page
        if (sort_by) {
            const [active, direction] = sort_by.split(',')
            value.adapter.sort = { active, direction }
        }
        if (value.adapter.options.sort) this.updateSortInfo(value.adapter.options.sort)
        this.filterFormVm = value.listViewModel.filterForm
        this._listViewModelActions = value.listViewModel.rowActions
        this.dataTableActions = Array.isArray(this._listViewModelActions) ? [...(this._listViewModelActions ?? [])] : this._listViewModelActions

        this.listenOnQueryParamsChange()
        if (this.filterFormVm) {
            if (this.filterFormVm.fields === null || this.filterFormVm.fields === undefined)
                throw new Error(`${DataListComponent.name} at ${value.path} filterForm fields is null or undefined`)

            const toFilterDescriptor = this.filterFormVm.toFilterDescriptor ?? formSchemeToDynamicFormFilter(this.filterFormVm.fields)
            this.setDataTableActions(toFilterDescriptor(this.filterFormValue))
            this.filterDrawerStatus = localStorage.getItem(`${value.path}_dld`)
        }
    }

    constructor(
        public injector: Injector,
        public auth: AuthService,
        public http: HttpClient,
        public languageService: LanguageService,
        public scaffolder: ScaffoldingService,
        public ds: DataService,
        public route: ActivatedRoute,
        private router: Router,
        private dialog: DialogService,
        private confirmService: ConfirmService,
        public snack: SnackBarService,
        private listService: DataListResolverService,
        public bus: EventBus) {
    }

    async ngAfterViewInit() {
        this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
            if (this.collection !== params["collection"])
                this.collection = params["collection"]
        })
    }

    ngOnDestroy() {
        if (this.dataListResolverResult) {
            this.ds.refreshCache(this.dataListResolverResult.path);
            this.dataListResolverResult.adapter.destroy()
        }
    }

    filterDrawerStatus = 'closed'
    inputs$: Observable<DataListResolverResult<any>>

    private listenOnQueryParamsChange() {
        this.route.queryParams.pipe(
            takeUntilDestroyed(this.destroyRef))
            .subscribe((qps) => {
                this.filterFormValue = this.convertQpsToFilterFormValue(qps)
            })
    }

    toggleFilterDrawer() {
        if (this.filterFormVm.position === 'dialog') {
            this.dialog.openDialog(DataFilterFormComponent, {
                maxHeight: "90vh",
                width: "90%",
                maxWidth: "450px",
                closeOnNavigation: true,
                disableClose: true,
                direction: languageDir(this.languageService.language),
                title: 'Filter',
                inputs: {
                    value: this.filterFormValue,
                    fields: this.filterFormVm.fields,
                    // toFilterDescriptor: this.filterFormVm.toFilterDescriptor
                },
                outputs: {
                    filterChanged: (e: FilterDescriptor) => {
                        this.filterValueChangeHandler(e)
                    }
                }
            })
        }
        else {
            this.filterDrawer?.toggle();
            localStorage.setItem(`${this.dataListResolverResult.path}_dld`, this.filterDrawer?.opened ? 'opened' : 'closed')
        }
    }

    selectionChanged(s) { }

    updatePageInfo(e) {

        const { page, per_page } = this.route.snapshot.queryParams
        if (page === this.page && per_page === this.per_page) return
        this.router.navigate([], {
            queryParams: { page: this.page, per_page: this.per_page },
            queryParamsHandling: "merge",
            relativeTo: this.route
        })
    }

    updateSortInfo($event) {
        const { sort_by = '' } = $event.direction ? { sort_by: `${$event.active},${$event.direction}` } : {}
        this.router.navigate([], {
            queryParams: { sort_by },
            queryParamsHandling: "merge",
            relativeTo: this.route
        })
    }

    convertQpsToFilterFormValue(qps: Params): Record<string, any> {
        if (!this.filterFormVm) return null
        const { groupBy } = this.filterFormVm as any

        if (!qps) return null
        if (!groupBy && !qps) return null
        if (groupBy && !qps[groupBy]) return null

        // if no groupBy, return all qps that are in the filterFormVm fields
        return groupBy ? this.fromBase64(qps[groupBy]) : qps
    }

    private toBase64(obj): string { return btoa(JSON.stringify(obj)) }
    private fromBase64(str: string): any { return JSON.parse(atob(str)) }


    filterValueChangeHandler(e: FilterDescriptor) {
        this.setDataTableActions(e);
        const { groupBy } = this.filterFormVm ?? {} as any
        const q = groupBy ? { [this.filterFormVm.groupBy]: this.toBase64(this.filterFormValue) } : this.filterFormValue

        const vm = this.dataListResolverResult.listViewModel
        const _q = vm.query?.() ?? [];
        const _qps = vm.queryParams?.() ?? [];
        const query = Object.fromEntries(_q); // this is an extra step to convert entries to Obj since the data service query is an object which has to be entries instead.
        const queryParams = Object.fromEntries(_qps); // this is an extra step to convert entries to Obj since the data service query is an object which has to be entries instead.

        const r = {
            ...this.route.snapshot.queryParams,
            ...queryParams,
            ...(q ?? {}),
            page: this.page,
            per_page: this.per_page,
            sort_by: this.sort_by
        }
        this.router.navigate([], {
            queryParams: r,
            queryParamsHandling: "merge",
            relativeTo: this.route
        })


        this.dataListResolverResult.adapter.filter = { ...r, ...query };
        this.dataListResolverResult.adapter.refresh()
    }

    get page() { return (this.dataListResolverResult.adapter.page?.pageIndex ?? 0) + 1 }
    get per_page() { return this.dataListResolverResult.adapter.page?.pageSize ?? 100 }
    get sort_by() { return this.dataListResolverResult.adapter.sort ? `${this.dataListResolverResult.adapter.sort.active},${this.dataListResolverResult.adapter.sort.direction}` : undefined }

    private setDataTableActions(e: FilterDescriptor) {
        const filterLength = Object.keys(e ?? {}).filter(k => e[k] !== undefined).length
        if (filterLength > 0) {
            this.filterButtonActionDescriptor.matBadge = '' + filterLength;
            this.filterButtonActionDescriptor.matBadgeColor = 'accent';
            this.filterButtonActionDescriptor.matBadgePosition = 'below after';
            this.filterButtonActionDescriptor.matBadgeSize = 'small';
        }

        this.dataTableActions = Array.isArray(this._listViewModelActions) ?
            [...(this._listViewModelActions ?? []), this.filterButtonActionDescriptor] :
            (row: any) => ((this._listViewModelActions as Function)(row) ?? []).concat(this.filterButtonActionDescriptor).slice();
    }


    private async openFormDialog(collection: string, payload: ActionEvent) {
        const id = payload.data?.length > 0 ? payload.data[0]._id : null;
        const path = '/' + [payload.action.name, collection, id].filter(s => s).join("/")

        const res = await this.scaffolder.dialogForm(path, {
            closeOnNavigation: true,
            disableClose: true,
            direction: languageDir(this.languageService.language),
            title: toTitleCase(`${payload.action.name} ${collection}`),
        })
        if (!res) return

        await this.refreshData();

    }

    private async refreshData() {
        if (this.dataListResolverResult.adapter.dataSource instanceof ServerDataSource) {
            const dpath = (this.dataListResolverResult.adapter.dataSource as ServerDataSource<any>).path;
            await this.ds.refreshCache((dpath));
            this.dataListResolverResult.adapter.refresh();
        }
        else {
            this.dataListResolverResult.adapter.refresh();
        }
    }

    async onAction(x: ActionEvent) {
        const path = PathInfo.parse(this.dataListResolverResult.path, 1);
        switch (x.action.name) {
            case "create":
            case "edit":
            case "view":
                await this.openFormDialog(this.collection, x);
                break;
            case "delete": {
                if (x.data.length === 0) return
                const dialogData = {
                    maxWidth: "450px",
                    title: "Delete",
                    confirmText: "Are you sure you want to delete this item?",
                    yes: 'Yes, delete',
                    no: 'No, cancel',
                    yesColor: "warn",

                } as ConfirmOptions;
                const confirmRes = await this.confirmService.openWarning(dialogData)
                if (confirmRes === true) {
                    for (const item of x.data) {
                        try {
                            await this.ds.delete(`${path.path}/${item._id}`);
                        }
                        catch (err) {
                            console.error(err);
                        }
                    }
                    await this.ds.refreshCache(path.path);
                    this.dataListResolverResult.adapter.refresh();
                }
                break;
            }
            default:
                const id = `${this.collection}_${x.action.name}`
                this.bus.emit(id, {
                    msg: id,
                    ...x,
                }, this);
                break;
        }
    }
}
