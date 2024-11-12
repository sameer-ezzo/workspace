import {
    Component,
    EventEmitter,
    OnChanges,
    Input,
    Output,
    SimpleChanges,
    Type,
    ElementRef,
    forwardRef,
    ViewChild,
    ChangeDetectionStrategy,
    WritableSignal,
    signal,
    HostBinding,
    HostListener,
    inject,
    input,
    output,
    effect,
    Injector,
    InjectionToken,
    Signal,
    DestroyRef,
} from '@angular/core';

import { BreakpointObserver, Breakpoints } from "@angular/cdk/layout";

import { DataAdapter, NormalizedItem } from '@upupa/data';

import { MatCheckboxChange } from '@angular/material/checkbox';
import { DataComponentBase } from './data-base.component';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ColumnsDescriptorStrict, ColumnsDescriptor } from './types';
import { MatTable } from '@angular/material/table';

export const ROW_ITEM = new InjectionToken<any>('ITEM');

export function injectRowItem() {
    return inject(ROW_ITEM);
}

@Component({
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
    host: {
        "attr.role": "table",
        "[attr.tabindex]": "tabindex",
        "[attr.id]": "name()",
    },
})
export class DataTableComponent<T = any> extends DataComponentBase<T> implements OnChanges {
    tabindex = input(-1);
    host: ElementRef<HTMLElement> = inject(ElementRef);
    breakpointObserver = inject(BreakpointObserver);

    stickyHeader = input(false);

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

    private readonly injector = inject(Injector);
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
                    {
                        provide: DataAdapter,
                        useValue: this.adapter(),
                    },
                ],
                name: 'RowInjector',
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

        this.selectedNormalized.subscribe((sns) => {
            this.selectionChange.emit(sns);
        });
    }

    override async ngOnChanges(changes: SimpleChanges) {
        await super.ngOnChanges(changes);

        if (changes["adapter"]) this.adapter().refresh();
        if (changes["columns"]) this.generateColumns();
    }

    private generateColumns() {
        const columns = this.columns();
        const adapter = this.adapter();
        if (columns === "auto") {
            this._properties = {};
            if (adapter.normalized && adapter.normalized.length) {
                const cols: any = {};
                adapter.normalized.forEach((x) => Object.keys(x.item).forEach((k) => (cols[k] = 1)));
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

        if (this.name && localStorage) {
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
            const all = this.adapter().normalized;
            const i1 = all.indexOf(row);
            const i2 = all.indexOf(this.focusedItem());

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
    onAdd() {
        this.add.emit();
    }

    isPurePipe(pipe: Type<any>): boolean {
        return !!pipe.prototype.constructor.ɵpipe.pure;
    }

    merge(obj1: any, obj2: any) {
        return { ...obj1, ...obj2 };
    }
}
