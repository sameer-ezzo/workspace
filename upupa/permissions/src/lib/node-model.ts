import { Rule } from '@noah-ark/common';


export type NodeModel<T = Rule> = { path: string, level: number; rule: T | null; children?: NodeModel<T>[]; };
