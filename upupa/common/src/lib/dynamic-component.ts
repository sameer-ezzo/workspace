import { Type, Injector, ComponentRef } from '@angular/core';
import { ContentNode } from './routing/content-node';

export type DynamicComponent = {
    component: Type<any>;
    inputs?: Record<string, any>;
    content?: ContentNode[][];
    outputs?: Record<string, (source: ComponentRef<any>, e: any) => void | Promise<void>>;
    class?: string;
    injector?: Injector;
};
