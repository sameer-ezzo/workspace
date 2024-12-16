import { Type, Injector, ComponentRef } from "@angular/core";
import { ContentNode } from "./routing/content-node";

export type DynamicTemplate<C = any> = Type<C> | DynamicComponent<C>;

export type DynamicComponent<C = any> = {
    component: Type<C>;
    inputs?: Partial<Record<keyof C, any>>;
    content?: ContentNode[][];
    outputs?: Partial<Record<keyof C, (source: ComponentRef<C>, e: any) => void | Promise<void>>>;
    class?: string;
    injector?: Injector;
};

export function component(template: DynamicTemplate): DynamicComponent {
    if (!template) throw new Error("Template is required");
    if ("component" in template) return template;
    return { component: template };
}


export function provideComponent<T>(template: DynamicTemplate<T>): DynamicComponent<T> {
    return component(template);
}