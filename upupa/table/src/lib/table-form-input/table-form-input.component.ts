import { Component, Input, ChangeDetectionStrategy, forwardRef } from '@angular/core'
import { NormalizedItem } from '@upupa/data'
import { ActionDescriptor } from '@upupa/common'
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms'
import { DataTableComponent } from '../data-table.component'
import { ValueDataComponentBase } from '../value-data-base.component'
import { ColumnsDescriptor } from '../types'

@Component({
    selector: 'table-form-input',
    templateUrl: './table-form-input.component.html',
    styleUrls: ['./table-form-input.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DataTableComponent), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => DataTableComponent), multi: true }
    ]
})
export class TableFormInput<T = any> extends ValueDataComponentBase<T> {

    @Input() stickyHeader = true
    @Input() showSearch: boolean | 'true' | 'false' = true
    @Input() label: string
    @Input() actions: ActionDescriptor[] | ((context) => ActionDescriptor[]) = [] // this represents the actions that will be shown in each row
    @Input() headerActions: ActionDescriptor[] | ((context) => ActionDescriptor[]) = [] // this represents the actions that will be shown in the header of the table
    @Input() rowClass: (item: NormalizedItem<T>) => string = (item) => item.key.toString()
    @Input() pageSizeOptions = [10, 25, 50, 100, 200]
    @Input() columns: string[] | ColumnsDescriptor | 'auto' = 'auto' //eventually columns are the container of all and it's a dictionary
    @Input() templates: any = {}

    @Input() expandable: 'single' | 'multi' | 'none' = 'none'
    @Input() expandableTemplate: any = null

    @Input() cellTemplate: any
    @Input() allowChangeColumnsOptions = false

    selectionChange(event) {
        this.value = this.selectedNormalized.map((item) => item.value)
    }
}

