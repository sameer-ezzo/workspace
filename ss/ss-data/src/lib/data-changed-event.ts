import { Patch } from "./model";
import { Principle } from "@noah-ark/common";


export type DataChangedEvent<T = any> = {
    path: string;
    data: T;
    patches: Patch[];
    user?: Principle;
};
