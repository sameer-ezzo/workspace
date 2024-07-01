import { Component, Input, SimpleChanges, inject } from '@angular/core';
import { EventBus } from '@upupa/common';
import { ClientDataSource, DataAdapter, NormalizedItem } from '@upupa/data';
import { ChipsComponent } from '@upupa/dynamic-form-native-theme';
import { Tag } from '../tag.model';
import { TagsService } from '../tags.service';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';

@Component({
  selector: 'tags-chips-input',
  templateUrl: './tags-chips-input.component.html',
  styleUrls: ['./tags-chips-input.component.scss']
})
export class TagsChipsInputComponent extends ChipsComponent {

  @Input() readonly = false
  private readonly tagsService = inject(TagsService)
  protected override  readonly bus = inject(EventBus)
  private _parentPath = undefined
  private readonly tagsDs = new ClientDataSource([])
  override readonly adapter = new DataAdapter<Tag>(this.tagsDs, '_id', 'name', '_id', undefined, {
    terms: [
      { field: '_id', type: 'like' },
      { field: 'name', type: 'like' }
    ],
    page: {
      pageSize: 25
    }
  })

  @Input() canAdd = true
  @Input()
  public get parentPath(): string {
    return this._parentPath;
  }
  public set parentPath(v: string) {
    if (this._parentPath === v) return
    this._parentPath = v
    this._refresh()
  }

  private readonly _refresh = () => {
    this.tagsService.getTags(this.parentPath).subscribe(tags => {
      this.tagsDs.all = tags.slice()
      this.adapter.refresh()
    })
  }

  override remove(item: NormalizedItem): void {
    this.value = this.value.filter(v => v === item.key)
    this.control.markAllAsTouched()
    this.control.markAsDirty()
  }

  updateFilter(f: string) {
    this.q = f
  }
  optionSelected(event: MatAutocompleteSelectedEvent) {
    const v = event.option.value
    super.selectionChange(v)
  }


  override async onAdding(value: string): Promise<void> {

    if (this.canAdd !== true) return

    const chip = value

    if (this.findKeyInValue(chip)) return
    const tag = await this.tagsService.createTag({ _id: chip }, this.parentPath)
    const nTag = this.adapter.normalize(tag)
    this.value = [...((this.value ?? []) as string[]), nTag.value]
    this._clearFilter()
    this.control.markAsDirty()
    this._refresh()
  }
}

