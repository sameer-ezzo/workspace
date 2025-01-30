import {
    Component,
    OnChanges,
    SimpleChanges,
    Type,
    ElementRef,
    ViewChild,
    ChangeDetectionStrategy,
    WritableSignal,
    signal,
    HostListener,
    inject,
    input,
    output,
    effect,
    Injector,
    InjectionToken,
    DestroyRef,
    forwardRef,
} from "@angular/core";

import { BreakpointObserver, Breakpoints } from "@angular/cdk/layout";

import { DataAdapter, NormalizedItem } from "@upupa/data";

import { MatCheckboxChange, MatCheckboxModule } from "@angular/material/checkbox";
import { DataComponentBase } from "./data-base.component";
import { animate, state, style, transition, trigger } from "@angular/animations";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ColumnsDescriptorStrict, ColumnsDescriptor } from "./types";
import { MatTable, MatTableModule } from "@angular/material/table";
import { MatPaginatorModule } from "@angular/material/paginator";
import { MatSortModule } from "@angular/material/sort";
import { CommonModule } from "@angular/common";
import { DragDropModule } from "@angular/cdk/drag-drop";
import { DefaultTableCellTemplate } from "./cell-template-component";
import { JsonPointerPipe } from "./json-pointer.pipe";
import { PortalComponent } from "@upupa/common";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatIconModule } from "@angular/material/icon";

export const ROW_ITEM = new InjectionToken<any>("ITEM");

export function injectRowItem() {
    return inject(ROW_ITEM);
}
export function injectDataAdapter() {
    return inject(DataAdapter);
}

@Component({
    standalone: true,
    selector: "data-table",
    templateUrl: "./data-table.component.html",
    styleUrls: ["./data-table.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [
        trigger("detailExpand", [
            state("collapsed,void", style({ height: "0px", minHeight: "0" })),
            state("expanded", style({ height: "*" })),
            transition("expanded <=> collapsed", animate("225ms cubic-bezier(0.4, 0.0, 0.2, 1)")),
        ]),
    ],
    imports: [
        MatPaginatorModule,
        MatTableModule,
        MatSortModule,
        MatCheckboxModule,
        MatProgressBarModule,
        CommonModule,
        MatIconModule,
        DragDropModule,
        DefaultTableCellTemplate,
        PortalComponent,
        JsonPointerPipe,
    ],
    host: {
        "attr.role": "table",
        "[attr.tabindex]": "tabindex",
        "[attr.id]": "name()",
    },
    providers: [
        {
            provide: DataAdapter,
            useFactory: (self: DataTableComponent) => self.adapter(),
            deps: [forwardRef(() => DataTableComponent)],
        },
    ],
})
export class DataTableComponent<T = any> extends DataComponentBase<T> implements OnChanges {
    showPaginator = input(true, { transform: (v) => (v === false ? false : true) });
    tabindex = input(-1);
    host: ElementRef<HTMLElement> = inject(ElementRef);
    breakpointObserver = inject(BreakpointObserver);
    stickyHeader = input(false);
    override maxAllowed = input<number, number>(Number.MAX_SAFE_INTEGER, { transform: (v) => Number.MAX_SAFE_INTEGER });
    contentChanged = output<void>();
    name = input<string, string>(`table_${Date.now()}`, {
        alias: "tableName",
        transform: (v) => (v ? v : `table_${Date.now()}`),
    });
    pageSizeOptions = input<number[]>([10, 25, 50, 100, 200]);

    rowClass = input<(item: NormalizedItem<T>) => string>((item) => (item.key ?? item).toString());

    _properties: ColumnsDescriptorStrict = {}; //only data columns
    _columns: string[] = [];
    columns = input<ColumnsDescriptor | "auto">("auto"); //eventually columns are the container of all and it's a dictionary

    expanded: { [key: string]: WritableSignal<boolean> } = {};
    expandable = input<"single" | "multi" | "none">("none");
    expandableTemplate = input(null);
    toggleExpand(row, index) {
        if (!this.expanded[row.key]) this.expanded[row.key] = signal(false);
        const v = this.expanded[row.key]?.();
        this.expanded[row.key].set(!v);
    }

    private readonly _rowInjectors = new Map<NormalizedItem<T>, Injector>();
    private createRowInjector(row: NormalizedItem<T>) {
        this._rowInjectors.set(
            row,
            Injector.create({
                providers: [
                    {
                        provide: ROW_ITEM,
                        useValue: row.item,
                    },
                ],
                name: "RowInjector",
                parent: this.injector,
            }),
        );

        return this._rowInjectors.get(row);
    }

    getRowInjector(row: NormalizedItem<T>) {
        return this._rowInjectors.get(row) ?? this.createRowInjector(row);
    }

    handset: boolean;
    selectionChange = output<NormalizedItem<T>[]>();

    destroyRef = inject(DestroyRef);

    constructor() {
        super();
        effect(() => {
            const s = this.selectedNormalized();
            this.selectionChange.emit(s);
        });
    }
    ngOnInit() {
        // this.dataChangeListeners.push((data) => {
        this._rowInjectors.clear(); //clear row injectors on data change

        //     if (this.columns() === 'auto') this.generateColumns();
        // });

        this.breakpointObserver
            .observe([Breakpoints.Handset])
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((result) => {
                this.handset = result.matches;
            });
    }

    override async ngOnChanges(changes: SimpleChanges) {
        if (changes["adapter"]) {
            const adapter = this.adapter();
            if (!adapter) throw new Error("Adapter is required");

            this.loadData();
        }
        await super.ngOnChanges(changes);

        if (changes["columns"]) this.generateColumns();
    }

    private generateColumns() {
        const columns = this.columns();
        const adapter = this.adapter();
        const normalized = adapter.normalized();
        if (columns === "auto") {
            this._properties = {};
            if (normalized.length) {
                const cols: any = {};
                normalized.forEach((x) => Object.keys(x.item).forEach((k) => (cols[k] = 1)));
                Object.keys(cols).forEach((k) => {
                    if (!k.startsWith("_")) this._properties[k] = {};
                });
            }
        } else if (Array.isArray(columns)) {
            this._properties = {};
            columns.forEach(([k, v]) => {
                this._properties[k] = { displayPath: k, ...v };
                if (v?.template) {
                    const template = Array.isArray(v.template) ? v.template : [v.template];
                    this._properties[k].template = template.map((t) => ("component" in t ? t : { component: t }));
                }
            });
        } else {
            this._properties = {};
            Object.keys(columns).forEach((k) => {
                if (columns[k] === 1) this._properties[k] = {};
                else if (columns[k] === 0) this._properties[k] = { visible: false };
                else {
                    this._properties[k] = {
                        ...columns[k],
                    };
                    if (columns[k]?.template) {
                        const template = Array.isArray(columns[k]?.template) ? columns[k]?.template : [columns[k]?.template];
                        this._properties[k].template = template.map((t) => ("component" in t ? t : { component: t }));
                    }
                }
            });
        }

        if (this.name && typeof localStorage !== "undefined") {
            const parseJson = (str, def) => {
                if (!str) return def;
                try {
                    return JSON.parse(str);
                } catch (e) {
                    return def;
                }
            };

            const storageColumnsInfoStr = localStorage.getItem(`table#${this.name()}`);
            const storageColumnsInfo = parseJson(storageColumnsInfoStr, []);
            if (storageColumnsInfo.length > 0) {
                for (const prop in this._properties) {
                    const colInfo = storageColumnsInfo.find((x) => x.name === prop) ?? {
                        visible: true,
                        sticky: false,
                    };

                    this._properties[prop].visible = colInfo.visible;
                    this._properties[prop].sticky = colInfo.sticky;
                }
            }
        }

        this._columns = [];

        const selectCol = this._properties["select"];
        const iCol = this._properties["i"];

        delete this._properties["select"];
        delete this._properties["i"];

        if (iCol && iCol.visible !== false) this._columns.push("i");
        if (selectCol === undefined || selectCol.visible !== false) this._columns.push("select");

        this._columns.push(...Object.keys(this._properties));
    }

    shiftKeyPressed = false;
    @HostListener("document:keydown", ["$event"])
    handleKeyboardEvent(event: KeyboardEvent) {
        if (event.key === "Shift") this.shiftKeyPressed = this.maxAllowed() !== 1;
    }

    @HostListener("document:keyup", ["$event"])
    handleKeyboardEventUp(event: KeyboardEvent) {
        if (event.key === "Shift") this.shiftKeyPressed = false;
    }

    toggleSelection(event: MatCheckboxChange, row, selectInBetween = false) {
        let rows = [row];
        if (this.shiftKeyPressed === true) selectInBetween = true;
        if (selectInBetween) {
            const all = this.adapter().normalized();
            const i1 = all.indexOf(row);
            const i2 = this.focusedItem() ? all.indexOf(all.find((e) => e.item === this.focusedItem())) : -1;

            if (i1 > -1 && i2 > -1) rows = all.slice(Math.min(i1, i2), Math.max(i1, i2) + 1);
        }

        for (const r of rows) {
            if (event.checked) this.select(r.key);
            else this.deselect(r.key);
        }

        this.setFocusedItem(row);
    }

    //todo grouping https://docs.mongodb.com/manual/reference/operator/aggregation/group/
    isGroup(row: any): boolean {
        return row.group;
    }

    // eslint-disable-next-line @typescript-eslint/member-ordering
    @ViewChild(MatTable) table: MatTable<T>;

    // eslint-disable-next-line @typescript-eslint/member-ordering
    // @Output() rowDropped = new EventEmitter()
    // drop(event: CdkDragDrop<any[]>) {
    //     this.table.renderRows()
    //     this.rowDropped.emit({ event, from: event.previousIndex, to: event.currentIndex })

    //     // const prevIndex = this.adapter.normalized.findIndex((d) => d === e.event.item.data)
    //     // moveItemInArray(this.adapter.normalized, prevIndex, e.event.currentIndex)
    // }

    isPurePipe(pipe: Type<any>): boolean {
        return !!pipe.prototype.constructor.ɵpipe.pure;
    }

    merge(obj1: any, obj2: any) {
        return { ...obj1, ...obj2 };
    }

    trackByFn(index, item) {
        return item.key;
    }
}
