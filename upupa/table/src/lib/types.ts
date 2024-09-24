import { Type } from '@angular/core';
import { SortHeaderArrowPosition } from '@angular/material/sort';
import { NormalizedItem } from '@upupa/data';

export type PipeDescriptor = { pipe: Type<any>; args: string[] };
export type PipesDescriptor = { [column: string]: PipeDescriptor | Type<any> };

export type ColumnDescriptor = {
  displayPath?: string;
  order?: number;
  header?: string;
  width?: number;
  visible?: boolean;
  sticky?: 'start' | 'end';
  sortDisabled?: boolean;
  sortId?: string;
  sortArrowPosition?: SortHeaderArrowPosition;
  pipe?: PipeDescriptor | Type<any>;
  component?: Type<any>;
};

export type ColumnsDescriptor<T = any> =
  | Iterable<readonly [keyof T, Partial<ColumnDescriptor>]>
  | {
      [key in keyof T]: ColumnDescriptor | 1 | 0;
    };

export type ColumnsDescriptorStrict = { [key: string]: ColumnDescriptor };
