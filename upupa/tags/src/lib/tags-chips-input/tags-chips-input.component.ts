import { Component, Input, SimpleChanges } from '@angular/core';
import { EventBus } from '@upupa/common';
import { ClientDataSource, DataAdapter } from '@upupa/data';
import { ChipsComponent } from '@upupa/dynamic-form-native-theme';
import { Tag } from '../tag.model';
import { TagsService } from '../tags.service';


@Component({
  selector: 'tags-chips-input',
  templateUrl: './tags-chips-input.component.html',
  styleUrls: ['./tags-chips-input.component.scss']
})
export class TagsChipsInputComponent extends ChipsComponent {
  
  @Input() canAdd = true

  private _parentPath = '/'
  @Input()
  public get parentPath(): string {
    return this._parentPath;
  }
  public set parentPath(v: string) {
    if (this._parentPath === v) return
    this._parentPath = v
    this.adapter?.destroy()
    this.tagsDs?.destroy()

    this.tagsDs = new ClientDataSource(this.tagsService.getTags(v))
    this.adapter = new DataAdapter<Tag>(this.tagsDs, '_id', 'name', undefined, undefined, {
      terms: [{ field: '_id', type: 'like' },
      { field: 'name', type: 'like' }],
      page: {
        pageSize: 25
      }
    })
  }


  tagsDs: ClientDataSource<Tag>

  constructor(private readonly tagsService: TagsService, protected override  readonly bus: EventBus) {
    super(bus)
  }


  override async onAdding(value: string): Promise<void> {
    if (this.canAdd !== true) return

    const chip = value

    if (this.isInValue(chip)) return
    const tag = await this.tagsService.createTag({ _id: chip }, this.parentPath)
    const nTag = this.adapter.normalize(tag)
    this.value = [...((this.value ?? []) as string[]), nTag.key]
    this._clearFilter()
    this.control.markAsDirty()
    this.tagsService.getTags(this.parentPath).subscribe(tags => this.tagsDs.all = tags)
  }
}

