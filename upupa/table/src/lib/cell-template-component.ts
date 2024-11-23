import { KeyValue } from "@angular/common";
import { Component, input, Input, InputSignal } from "@angular/core";
import { ColumnDescriptor } from "./types";
import { NormalizedItem } from "@upupa/data";
import { DynamicComponent } from "@upupa/common";

export interface ITableCellTemplate<TValue = any, TRow = any> {
    value?: InputSignal<TValue>;
    element?: InputSignal<{ item: TRow }>;
    item?: InputSignal<TRow>;
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
    element = input.required<NormalizedItem<T>>();
    item = input.required<T>();
    descriptor = input<KeyValue<string, ColumnDescriptor>>();
}

export function objectCell<T = unknown>(textProp: keyof T = "title" as any, href?: (x: T) => string): DynamicComponent {
    return {
        component: ObjectCellTemplate,
        inputs: {
            textProp,
            href,
        },
    };
}

@Component({
    standalone: true,
    template: `
        @let _href = href() ? href()(value()) : null;
        @if (_href) {
            <a [href]="_href">{{ value()?.[textProp()] }}</a>
        } @else {
            {{ value()?.[textProp()] }}
        }
    `,
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class ObjectCellTemplate<TValue = unknown> implements ITableCellTemplate<TValue> {
    textProp = input.required<keyof TValue>();
    href = input<(value: TValue) => string>();
    value = input<TValue>();
}

export function nameCell() {
    return objectCell("name");
}
export function titleCell() {
    return objectCell("title");
}
