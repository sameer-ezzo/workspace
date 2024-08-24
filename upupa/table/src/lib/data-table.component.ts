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
  AfterViewInit,
  inject,
  ChangeDetectorRef,
  WritableSignal,
  signal,
  ViewContainerRef,
  ComponentRef,
  computed,
  HostBinding,
  HostListener,
} from '@angular/core';
import { debounceTime, takeUntil } from 'rxjs/operators';

import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatDialog } from '@angular/material/dialog';
import { ColumnsSelectComponent } from './columns-select.component/columns-select.component';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';

import { NormalizedItem } from '@upupa/data';

import { ActionDescriptor, ActionEvent, EventBus } from '@upupa/common';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { firstValueFrom } from 'rxjs';
import { DataComponentBase } from './data-base.component';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DialogService } from '@upupa/dialog';
import { ColumnsDescriptorStrict, ColumnsDescriptor } from './types';
import { MatTable } from '@angular/material/table';

@Component({
  selector: 'data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DataTableComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => DataTableComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('detailExpand', [
      state('collapsed,void', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'),
      ),
    ]),
  ],
})
export class DataTableComponent<T = any>
  extends DataComponentBase<T>
  implements OnChanges, AfterViewInit
{
  @HostBinding('attr.tabindex') tabindex = 0;

  @Input() name: string;
  @Input() stickyHeader = true;
  @Input() showSearch: boolean | 'true' | 'false' = true;
  hasHeader = computed(() => {
    return this.showSearch === true || (this.label || '').length > 0;
  });

  @Input() label: string;
  @Input() actions: ActionDescriptor[] | ((context) => ActionDescriptor[]) = []; // this represents the actions that will be shown in each row
  @Input() headerActions:
    | ActionDescriptor[]
    | ((context) => ActionDescriptor[]) = []; // this represents the actions that will be shown in the header of the table

  @Input() rowClass: (item: NormalizedItem<T>) => string = (item) =>
    item.key.toString();
  @Output() action = new EventEmitter<ActionEvent>();

  @Input() pageSizeOptions = [10, 25, 50, 100, 200];

  _properties: ColumnsDescriptorStrict = {}; //only data columns
  _columns: string[] = [];
  @Input() columns: string[] | ColumnsDescriptor | 'auto' = 'auto'; //eventually columns are the container of all and it's a dictionary
  @Input() templates: any = {};

  expanded: { [key: string]: WritableSignal<boolean> } = {};
  @Input() expandable: 'single' | 'multi' | 'none' = 'none';
  @Input() expandableTemplate: any = null;
  toggleExpand(row, index) {
    if (!this.expanded[row.key]) this.expanded[row.key] = signal(false);
    const v = this.expanded[row.key]?.();
    this.expanded[row.key].set(!v);
  }

  @Input() cellTemplate: any;
  @ViewChild('defaultTemplate') defaultTemplate: any;

  readonly _allowChangeColumnsOptions = signal(false);
  @Input()
  public get allowChangeColumnsOptions() {
    return this._allowChangeColumnsOptions();
  }
  public set allowChangeColumnsOptions(value) {
    this._allowChangeColumnsOptions.set(value);
  }

  // _updateViewModel(): Promise<void> {
  //     this.selected = this.value
  // }

  constructor(
    protected host: ElementRef<HTMLElement>,
    private bus: EventBus,
    protected breakpointObserver: BreakpointObserver,
    protected dialog: DialogService,
  ) {
    super();
    this.maxAllowed = Infinity;
  }

  handset: boolean;
  @Output() selectionChange = new EventEmitter<NormalizedItem<T>[]>();
  override ngOnInit() {
    super.ngOnInit();

    this.dataChangeListeners.push((data) => {
      if (this.columns === 'auto') this.generateColumns();
    });

    this.breakpointObserver
      .observe([Breakpoints.Handset])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        this.handset = result.matches;
      });
  }

  ngAfterViewInit(): void {
    if (!this.cellTemplate) this.cellTemplate = this.defaultTemplate;
  }

  override async ngOnChanges(changes: SimpleChanges) {
    await super.ngOnChanges(changes);
    if (changes['showSearch']) {
      this.showSearch =
        this.showSearch === true || String(this.showSearch) === 'true';
    }
    if (changes['adapter']) {
      this.adapter.refresh();
    }
    if (changes['columns']) this.generateColumns();
  }

  private generateColumns() {
    if (this.columns === 'auto') {
      this._properties = {};
      if (this.adapter.normalized && this.adapter.normalized.length) {
        const columns: any = {};
        this.adapter.normalized.forEach((x) =>
          Object.keys(x.item).forEach((k) => (columns[k] = 1)),
        );
        Object.keys(columns).forEach((k) => {
          if (!k.startsWith('_')) this._properties[k] = {};
        });
      }
    } else if (Array.isArray(this.columns)) {
      this._properties = {};
      this.columns.forEach((k) => {
        this._properties[k] = {};
      });
    } else {
      this._properties = {};
      Object.keys(this.columns).forEach((k) => {
        if (this.columns[k] === 1) this._properties[k] = {};
        else if (this.columns[k] === 0)
          this._properties[k] = { visible: false };
        else this._properties[k] = this.columns[k];
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

      const storageColumnsInfoStr = localStorage.getItem(`table#${this.name}`);
      const storageColumnsInfo = parseJson(storageColumnsInfoStr, []);
      this.allowChangeColumnsOptions =
        this.allowChangeColumnsOptions || storageColumnsInfo.length > 0;
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

    const selectCol = this._properties['select'];
    const iCol = this._properties['i'];
    const actionsCol = this._properties['actions'];
    delete this._properties['select'];
    delete this._properties['i'];
    delete this._properties['actions'];

    if (iCol && iCol.visible !== false) this._columns.push('i');
    if (selectCol === undefined || selectCol.visible !== false)
      this._columns.push('select');

    this._columns.push(...Object.keys(this._properties));

    if (
      this.actions &&
      (actionsCol === undefined || actionsCol.visible !== false)
    ) {
      this._columns.push('actions');
    }
  }

  async openColumnsSelectDialog() {
    await firstValueFrom(
      this.dialog
        .openDialog(ColumnsSelectComponent, {
          title: 'Select columns',
          width: '60%',
          inputs: { data: { table: this.name, columns: this._properties } },
        })
        .afterClosed(),
    );
  }

  onAction(e: ActionEvent) {
    //TODO should action set loading automatically just like filter?
    this.action.emit(e);
    this.bus.emit(
      `${this.name?.trim().length > 0 ? this.name + '-' : ''}${e.action.name}`,
      e,
      this,
    );
  }

  shiftKeyPressed = false;
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'Shift') this.shiftKeyPressed = this.maxAllowed !== 1;
  }

  @HostListener('document:keyup', ['$event'])
  handleKeyboardEventUp(event: KeyboardEvent) {
    if (event.key === 'Shift') this.shiftKeyPressed = false;
  }

  toggleSelection(event: MatCheckboxChange, row, selectInBetween = false) {
    let rows = [row];
    if (this.shiftKeyPressed === true) selectInBetween = true;
    if (selectInBetween) {
      const all = this.adapter.normalized;
      const i1 = all.indexOf(row);
      const i2 = all.indexOf(this.focusedItem);

      if (i1 > -1 && i2 > -1)
        rows = all.slice(Math.min(i1, i2), Math.max(i1, i2) + 1);
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
}
