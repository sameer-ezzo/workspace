import { ENTER, COMMA } from '@angular/cdk/keycodes';
import { Component, ElementRef, Input, SimpleChanges, ViewChild } from '@angular/core';
import { MatAutocomplete, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import { EventBus } from '@upupa/common';
import { ClientDataSource, DataAdapter, DataService, NormalizedItem, ServerDataSource } from '@upupa/data';
import { InputDefaults, SelectComponent } from '@upupa/dynamic-form-native-theme';
import { Observable, combineLatest, debounceTime, map, firstValueFrom, take, catchError, of, timeout } from 'rxjs';
import { Tag } from '../tag.model';
import { TagsService } from '../tags.service';


@Component({
  selector: 'tags-select-input',
  templateUrl: './tags-select-input.component.html',
  styleUrls: ['./tags-select-input.component.scss']
})
export class TagsSelectInputComponent extends SelectComponent<Tag> {
  @ViewChild('auto') matAutocomplete: MatAutocomplete
  @ViewChild('filterInput') filterInput: ElementRef<HTMLInputElement>

  @Input() visible = true
  @Input() selectable = true
  @Input() removable = true
  @Input() canAdd = true




  handled = false

  private _parentPath = '/'
  @Input()
  public get parentPath(): string {
    return this._parentPath;
  }
  public set parentPath(v: string) {
    if (this._parentPath === v) return
    this._parentPath = v

    this.tagsService.getTags(v).subscribe(tags => this.tagsDs.all = tags)
  }
  options$: Observable<NormalizedItem[]>
  tagsDs: ClientDataSource<Tag>


  constructor(private readonly tagsService: TagsService, private _bus: EventBus) {
    super(_bus)
    this.tagsDs = new ClientDataSource(this.tagsService.getTags(this.parentPath))
    this.adapter = new DataAdapter<Tag>(this.tagsDs, '_id', 'name', undefined, undefined, {
      terms: [{ field: 'name', type: 'like' }],
      page: { pageSize: 15 }
    })

    this.adapter.refresh()

    this.options$ = combineLatest([this.valueDataSource$, this.adapter.normalized$])
      .pipe(
        map(([vs, ns]) => {
          if (vs?.length > 0) return ns.filter(n => !vs.find(v => v?.key === n?.key))
          else return ns
        }))
  }




  override async ngOnChanges(changes: SimpleChanges): Promise<void> {
    if (changes['adapter']) {
      delete changes['adapter']
    }


    await super.ngOnChanges(changes)
  }

  isInValue(key: string) {
    const v = Array.isArray(this.valueDataSource) ? this.valueDataSource : [this.valueDataSource]
    return v.find(x => x?.key === key) != null
  }

  protected _select(item: NormalizedItem<any>) {
    this.select(item.key)
    this.value = [...((this.value ?? []) as string[]).slice(), item.key]
    this._clearFilter()
  }

  private _clearFilter() {
    this.q = this.filterInput.nativeElement.value = ''
  }

  selectionChange(e: MatAutocompleteSelectedEvent): void {
    if (!e.option.value) return

    setTimeout(() => { this.handled = false }, 50)
    this.handled = true


    const item = e.option.value as NormalizedItem<any>

    this.select(item.key)
    this.value = [...((this.value ?? []) as string[]).slice(), item.key]
    this._clearFilter()
    this.control.markAsDirty()
    this.control.markAllAsTouched()
  }


  remove(item: NormalizedItem): void {
    const v = this.valueDataSource as any[]
    const idx = v.findIndex(v => v.key === item.key)
    if (idx > -1) {
      (this.value as string[]).splice(idx, 1)
      this.value = (this.value as []).slice()
      this.control.markAsDirty()
      this.control.markAllAsTouched()
    }
  }


  filterInputChange(e: InputEvent) {
    this.q = (e.target as HTMLInputElement).value as string
  }

  async onAdding(e: MatChipInputEvent): Promise<void> {

    if (this.handled === true || this.canAdd !== true) return

    const chip = e.value

    if (this.isInValue(chip)) return
    const tag = await this.tagsService.createTag({ _id: chip }, this.parentPath)
    const nTag = this.adapter.normalize(tag)
    this.value = [...((this.value ?? []) as string[]), nTag.key]
    this._clearFilter()
    this.control.markAsDirty()
    this.tagsService.getTags(this.parentPath).subscribe(tags => this.tagsDs.all = tags)
  }
}

