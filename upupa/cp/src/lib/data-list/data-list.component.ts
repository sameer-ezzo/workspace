import { ChangeDetectionStrategy, Component, Injector, OnDestroy, ViewChild } from "@angular/core";
import { languageDir, LanguageService } from "@upupa/language";
import { ActionDescriptor, ActionEvent, ConfirmOptions } from "@upupa/common";
import { AuthService } from "@upupa/auth";
import { HttpClient } from "@angular/common/http";
import { DataService, FilterDescriptor, ServerDataSource } from "@upupa/data";
import { firstValueFrom, isObservable, Observable, Subject } from "rxjs";
import { filter, switchMap, takeUntil, tap } from "rxjs/operators";
import { ActivatedRoute, Params, Router } from "@angular/router";
import { DialogService, SnackBarService } from "@upupa/common";
import { DataFormComponent } from "../data-form/data-form.component";
import { ConfirmService } from "@upupa/common";
import { EventBus } from "@upupa/common";
import { ScaffoldingService } from "../scaffolding.service";
import {
    DataFormResolverResult,
    DataListFilterForm,
    DataListResolverResult,
} from "../../types";
import { PathInfo } from "@noah-ark/path-matcher";
import { DataListResolverService } from "../list-resolver.service";
import { defaultFormActions } from "../../defaults";

import { DataFilterFormComponent, formSchemeToDynamicFormFilter } from "../data-filter-form/data-filter-form.component";



@Component({
    selector: "cp-data-list",
    templateUrl: "./data-list.component.html",
    styleUrls: ["./data-list.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataListComponent implements OnDestroy {

    private _filterFormValue: any;
    private _listViewModelActions: (ActionDescriptor | ((row: any) => ActionDescriptor))[];
    dataTableActions: (ActionDescriptor | ((row: any) => ActionDescriptor))[];
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
    inputs: DataListResolverResult;

    @ViewChild("filterDrawer") filterDrawer: any;

    collection: string;
    destroyed$ = new Subject<void>();
    filterButtonActionDescriptor = { name: 'filter', icon: 'filter_list', header: true, variant: 'icon', handler: (event: ActionEvent) => this.toggleFilterDrawer() } as ActionDescriptor
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
        this.inputs$ = this.route.params.pipe(
            filter((ps) => this.collection !== ps["collection"]),
            tap((ps) => (this.collection = ps["collection"])),
            switchMap(async (ps) =>
                this.listService.resolve(this.route.snapshot, this.router.routerState.snapshot)
            ),
            tap((inputs) => {
                this.inputs = inputs

                //todo: make sure to call this only if no filter provided.
                this.inputs.adapter.refresh()

                const { page, per_page, sort_by } = this.route.snapshot.queryParams
                if (page) this.inputs.adapter.page.pageIndex = +page - 1
                if (per_page) this.inputs.adapter.page.pageSize = +per_page
                if (sort_by) {
                    const [active, direction] = sort_by.split(',')
                    this.inputs.adapter.sort = { active, direction }
                }

                this.filterFormVm = inputs.listViewModel.filterForm
                this._listViewModelActions = inputs.listViewModel.actions.slice()
                this.dataTableActions = [...(this._listViewModelActions ?? [])]

                this.listenOnQueryParamsChange()
                if (this.filterFormVm) {
                    if (this.filterFormVm.fields === null || this.filterFormVm.fields === undefined)
                        throw new Error(`${DataListComponent.name} at ${inputs.path} filterForm fields is null or undefined`)

                    const toFilterDescriptor = this.filterFormVm.toFilterDescriptor ?? formSchemeToDynamicFormFilter(this.filterFormVm.fields)
                    this.setDataTableActions(toFilterDescriptor(this.filterFormValue))
                    this.filterDrawerStatus = localStorage.getItem(`${this.inputs.path}_dld`)
                }

            })
        )
    }

    filterDrawerStatus = 'closed'
    inputs$: Observable<DataListResolverResult<any>>

    private listenOnQueryParamsChange() {
        this.route.queryParams.pipe(
            takeUntil(this.destroyed$))
            .subscribe((qps) => {
                this.filterFormValue = this.convertQpsToFilterFormValue(qps)
            })
    }

    toggleFilterDrawer() {
        if (this.filterFormVm.position === 'dialog') {
            this.dialog.openDialog(DataFilterFormComponent, {
                maxHeight: "90vh",
                width: "90%",
                maxWidth: "700px",
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
            localStorage.setItem(`${this.inputs.path}_dld`, this.filterDrawer?.opened ? 'opened' : 'closed')
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

        const { qps_sort } = this.route.snapshot.queryParams
        if (qps_sort === this.sort_by) return
        this.router.navigate([], {
            queryParams: { sort_by: this.sort_by },
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
        const { groupBy } = this.filterFormVm as any
        const q = groupBy ? { [this.filterFormVm.groupBy]: this.toBase64(this.filterFormValue) } : this.filterFormValue

        const vm = this.inputs.listViewModel
        const _q = vm.query?.() ?? [];
        const _qps = vm.queryParams?.() ?? [];
        const query = Object.fromEntries(_q); // this is an extra step to convert entries to Obj since the data service query is an object which has to be entries instead.
        const queryParams = Object.fromEntries(_qps); // this is an extra step to convert entries to Obj since the data service query is an object which has to be entries instead.

        const r = {
            ...this.route.snapshot.queryParams,
            ...queryParams,
            ...q,
            page: this.page,
            per_page: this.per_page,
            sort_by: this.sort_by
        }
        this.router.navigate([], {
            queryParams: r,
            queryParamsHandling: "merge",
            relativeTo: this.route
        })


        this.inputs.adapter.filter = { ...r, ...query };
        this.inputs.adapter.refresh()
    }

    get page() { return (this.inputs.adapter.page?.pageIndex ?? 0) + 1 }
    get per_page() { return this.inputs.adapter.page?.pageSize ?? 100 }
    get sort_by() { return this.inputs.adapter.sort ? `${this.inputs.adapter.sort.active},${this.inputs.adapter.sort.direction}` : undefined }

    private setDataTableActions(e: FilterDescriptor) {
        const filterLength = Object.keys(e ?? {}).filter(k => e[k] !== undefined).length
        if (filterLength > 0) {
            this.filterButtonActionDescriptor.matBadge = '' + filterLength;
            this.filterButtonActionDescriptor.matBadgeColor = 'accent';
            this.filterButtonActionDescriptor.matBadgePosition = 'below after';
            this.filterButtonActionDescriptor.matBadgeSize = 'small';
        }

        this.dataTableActions = [...(this._listViewModelActions ?? []), this.filterButtonActionDescriptor];
    }


    private async openFormDialog(collection: string, payload: ActionEvent) {
        const id = payload.data?.length > 0 ? payload.data[0]._id : null;
        const path = '/' + [payload.action.name, collection, id].filter(s => s).join("/")
        const scaffolder = await this.scaffolder.scaffold(path)

        const formResolverResult = (
            isObservable(scaffolder)
                ? await firstValueFrom(scaffolder)
                : await scaffolder
        ) as DataFormResolverResult<any>;

        if ((formResolverResult.formViewModel.actions ?? []).length === 0)
            formResolverResult.formViewModel.actions = defaultFormActions;

        const res = await firstValueFrom(
            this.dialog
                .openDialog(DataFormComponent, {
                    maxHeight: "90vh",
                    width: "90%",
                    maxWidth: "700px",
                    closeOnNavigation: true,
                    disableClose: true,
                    direction: languageDir(this.languageService.language),
                    title: payload.action.name + " " + collection,
                    inputs: { formResolverResult: scaffolder },
                })
                .afterClosed()
        )

        if (res) {
            if (this.inputs.adapter.dataSource instanceof ServerDataSource) {
                const dpath = (this.inputs.adapter.dataSource as ServerDataSource<any>).path
                await this.ds.refreshCache((dpath));
                this.inputs.adapter.refresh();
            }
            else {
                this.inputs.adapter.refresh();
            }
        }
    }

    ngOnDestroy() {
        this.destroyed$.next();
        this.destroyed$.complete();
    }

    async onAction(x: ActionEvent) {
        const path = PathInfo.parse(this.inputs.path, 1);
        switch (x.action.name) {
            case "create":
            case "edit":
            case "view":
                await this.openFormDialog(this.collection, x);
                break;
            case "delete": {
                if (x.data.length === 0) return
                const dialogData = {
                    maxWidth: "320px",
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
                    this.inputs.adapter.refresh();
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
