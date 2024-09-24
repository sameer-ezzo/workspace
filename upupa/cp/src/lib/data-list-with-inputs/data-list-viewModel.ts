export interface DataListLifecycleHook {}
export interface OnInit extends DataListLifecycleHook {
  ngOnInit(): void;
}
export interface OnDestroy extends DataListLifecycleHook {
  ngOnDestroy(): void;
}
export interface OnRefresh extends DataListLifecycleHook {
  onRefresh(): void;
}
export interface OnSelect extends DataListLifecycleHook {
  onSelect(): void;
}
export interface OnSelectAll extends DataListLifecycleHook {
  onSelectAll(): void;
}
export interface OnDeselect extends DataListLifecycleHook {
  onDeselect(): void;
}
export interface OnDeselectAll extends DataListLifecycleHook {
  onDeselectAll(): void;
}
export interface OnRowAction extends DataListLifecycleHook {
  onRowAction(): void;
}
export interface OnHeaderAction extends DataListLifecycleHook {
  onHeaderAction(): void;
}
export interface OnFilter extends DataListLifecycleHook {
  onFilter(): void;
}
export interface OnSort extends DataListLifecycleHook {
  onSort(): void;
}
export interface OnPageChange extends DataListLifecycleHook {
  onPageChange(): void;
}
export interface OnPageSizeChange extends DataListLifecycleHook {
  onPageSizeChange(): void;
}
export interface OnSearch extends DataListLifecycleHook {
  onSearch(): void;
}
export interface OnQuery extends DataListLifecycleHook {
  onQuery(): void;
}
export interface OnQueryParams extends DataListLifecycleHook {
  onQueryParams(): void;
}
export interface OnAdapterChange extends DataListLifecycleHook {
  onAdapterChange(): void;
}
export interface OnDataChange extends DataListLifecycleHook {
  onDataChange(): void;
}
export interface OnDataError extends DataListLifecycleHook {
  onDataError(): void;
}
export interface OnDataLoading extends DataListLifecycleHook {
  onDataLoading(): void;
}
export interface OnDataLoaded extends DataListLifecycleHook {
  onDataLoaded(): void;
}
