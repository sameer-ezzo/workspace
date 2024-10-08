import { KeyValue } from '@angular/common';
import { Component, input, Input } from '@angular/core';
import { ColumnDescriptor } from './types';

@Component({
    selector: 'default-table-cell-template',
    template: `
        @if (descriptor().value.pipe) { @if (descriptor().value.pipe['pipe']) {
        <div
            [innerHTML]="
                element().item[descriptor().key]
                    | dynamic
                        : descriptor().value.pipe['pipe']
                        : descriptor().value.pipe['args']
            "
        ></div>
        } @else {
        <div
            [innerHTML]="
                element().item[descriptor().key]
                    | dynamic : descriptor().value.pipe
            "
        ></div>
        } } @else { {{ element().item | jpointer : descriptor().key }} }
    `,
})
export class DefaultTableCellTemplate<T = any> {
    element = input.required<{ item: T }>();
    index = input<number>();
    descriptor = input<KeyValue<string, ColumnDescriptor>>();
}
