import { KeyValue } from "@angular/common";
import { Component, input, Input, InputSignal } from "@angular/core";
import { ColumnDescriptor } from "./types";

export interface ITableCellTemplate<TValue = any, TElement = any> {
    value?: InputSignal<TValue>;
    element?: InputSignal<{ item: TElement }>;
    dataIndex?: InputSignal<number>;
    descriptor?: InputSignal<KeyValue<string, ColumnDescriptor>>;
}

@Component({
    selector: "cell-template",
    template: `
        @if (descriptor().value.pipe) {
            @if (descriptor().value.pipe["pipe"]) {
                <div [innerHTML]="value() | dynamic: descriptor().value.pipe['pipe'] : descriptor().value.pipe['args']"></div>
            } @else {
                <div [innerHTML]="value() | dynamic: descriptor().value.pipe"></div>
            }
        } @else {
            {{ value() }}
        }
    `,
})
export class DefaultTableCellTemplate<T = any> implements ITableCellTemplate {
    value = input.required();
    descriptor = input<KeyValue<string, ColumnDescriptor>>();
}
