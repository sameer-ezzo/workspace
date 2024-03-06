import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, forwardRef, Input, SimpleChanges } from '@angular/core';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { EventRecord } from '@noah-ark/event-bus';
import { EventBus } from '@upupa/common';
import { ClientDataSource, DataAdapter } from '@upupa/data';
import { ChipsComponent, getAddChipEventName } from '../chips-input/chips-input.component';

@Component({
  selector: 'tags-input',
  templateUrl: './tags-input.component.html',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TagsInputComponent), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => TagsInputComponent), multi: true }

  ]
})
export class TagsInputComponent extends ChipsComponent {

  @Input() override visible = true
  @Input() override selectable = true
  @Input() override removable = true
  @Input() override separatorKeysCodes: number[] = [ENTER, COMMA]
  @Input() parentPath: string
  @Input() collection: string

//   chips: NormalizedItem<Tag>[] = [];
  private dataSource = new ClientDataSource([])
  constructor(private event_bus: EventBus) {
    super(event_bus)

    this.adapter = new DataAdapter(this.dataSource, '_id', 'name', undefined, undefined, {
      terms: [{ field: '_id', type: 'like' }, { field: 'name', type: 'like' }]
    })


  }

  async addChipHandler(e: EventRecord<any>) {
    const chip = e.payload.chip
    const name = chip.trim()
    const _id = undefined;//= this.tagsService.convertNameToId(name)
    let tag = await this.adapter.getItems([_id]).then(res => res?.[0])
    let _tag: any
    if (!tag) {
    //   _tag = await this.tagsService.createTag({ _id, name } as any, this.parentPath)
    //   tag = this.adapter.normalize(_tag)
    //   this.dataSource.all = [...this.dataSource.all, tag.item]
      this.adapter.refresh()
    }

    this.event_bus.emit(`${getAddChipEventName(this.name)}_reply`, tag, this)

  }

  private async _refreshAdapterData() {
    // const tags = await firstValueFrom(this.tagsService.getTags(this.parentPath))
    // this.dataSource.all = tags
  }

  override ngOnInit(): void {
    super.ngOnInit()
    this.event_bus.on(getAddChipEventName(this.name)).subscribe(e => this.addChipHandler(e))
  }

  override async ngOnChanges(changes: SimpleChanges): Promise<void> {
    await super.ngOnChanges(changes)
    if (changes['parentPath']) await this._refreshAdapterData()

  }

}