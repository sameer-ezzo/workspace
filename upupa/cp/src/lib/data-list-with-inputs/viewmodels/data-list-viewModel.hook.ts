export interface DataListLifecycleHook {}
export interface OnInit extends DataListLifecycleHook {
    ngOnInit?: (e: any) => void;
}
export interface OnDestroy extends DataListLifecycleHook {
    ngOnDestroy?: (e: any) => void;
}
export interface OnRefresh extends DataListLifecycleHook {
    onRefresh?: (e: any) => void;
}
export interface OnSelect extends DataListLifecycleHook {
    onSelect?: (e: any) => void;
}
export interface OnSelectAll extends DataListLifecycleHook {
    onSelectAll?: (e: any) => void;
}
export interface OnDeselect extends DataListLifecycleHook {
    onDeselect?: (e: any) => void;
}
export interface OnDeselectAll extends DataListLifecycleHook {
    onDeselectAll?: (e: any) => void;
}
export interface OnRowAction extends DataListLifecycleHook {
    onRowAction?: (e: any) => void;
}
export interface OnHeaderAction extends DataListLifecycleHook {
    onHeaderAction?: (e: any) => void;
}
export interface OnHeaderAction extends DataListLifecycleHook {
    onHeaderAction?: (e: any) => void;
}
export interface OnFilter extends DataListLifecycleHook {
    onFilter?: (e: any) => void;
}
export interface OnSort extends DataListLifecycleHook {
    onSort?: (e: any) => void;
}
export interface OnPageChange extends DataListLifecycleHook {
    onPageChange?: (e: any) => void;
}
export interface OnPageSizeChange extends DataListLifecycleHook {
    onPageSizeChange?: (e: any) => void;
}
export interface OnSearch extends DataListLifecycleHook {
    onSearch?: (e: any) => void;
}
export interface OnQuery extends DataListLifecycleHook {
    onQuery?: (e: any) => void;
}
export interface OnQueryParams extends DataListLifecycleHook {
    onQueryParams?: (e: any) => void;
}
export interface OnAdapterChange extends DataListLifecycleHook {
    onAdapterChange?: (e: any) => void;
}
export interface OnDataChange extends DataListLifecycleHook {
    onDataChange?: (e: any) => void;
}
export interface OnDataError extends DataListLifecycleHook {
    onDataError?: (e: any) => void;
}
export interface OnDataLoading extends DataListLifecycleHook {
    onDataLoading?: (e: any) => void;
}
export interface OnDataLoaded extends DataListLifecycleHook {
    onDataLoaded?: (e: any) => void;
}

export interface OnFocusedItemChange extends DataListLifecycleHook {
    onFocusedItemChange(event: any): void;
}
