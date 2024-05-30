import { Component, Input, Type } from "@angular/core";
import { ColumnDescriptor } from "@upupa/table";

@Component({ template: `` })
export abstract class CELL_TEMPLATE<T = any> {
    @Input() element: { item: T }
    @Input() index: number
    @Input() descriptor: ColumnDescriptor
}