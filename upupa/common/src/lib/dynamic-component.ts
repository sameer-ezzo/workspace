import { Type, Injector } from "@angular/core";
import { ContentNode } from './routing/content-node';


export type DynamicComponent = {
    component: Type<any>;
    inputs?: Record<string, any>;
    content?: ContentNode[][];
    outputs?: Record<string, (e: any) => void | Promise<void>>;
    class?: string;
    injector?: Injector;
};
