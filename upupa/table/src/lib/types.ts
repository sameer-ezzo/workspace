import { Type } from "@angular/core";
import { SortHeaderArrowPosition } from "@angular/material/sort";
import { DynamicTemplate } from "@upupa/common";

export type PipeDescriptor = { pipe: Type<any>; args: string[] };
export type PipesDescriptor = { [column: string]: PipeDescriptor | Type<any> };

export type ColumnDescriptor<Template = any> = {
    displayPath?: string;
    class?: string; // css class
    order?: number;
    header?: string;
    width?: number; // this number is in % of the table width
    visible?: boolean;
    sticky?: "start" | "end";
    sortDisabled?: boolean;
    sortId?: string;
    sortArrowPosition?: SortHeaderArrowPosition;
    pipe?: PipeDescriptor | Type<any>;
    template?: DynamicTemplate<Template> | DynamicTemplate<Template>[];
};

export type ColumnsDescriptor<T = any> =
    | Iterable<readonly [keyof T, Partial<ColumnDescriptor>]>
    | {
          [key in keyof T]: ColumnDescriptor | 1 | 0;
      };

export type ColumnsDescriptorStrict = { [key: string]: ColumnDescriptor };
