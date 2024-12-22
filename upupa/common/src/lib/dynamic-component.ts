import { Type, Injector, ComponentRef, InputSignal, OutputRef } from "@angular/core";
import { ContentNode } from "./routing/content-node";

export type DynamicTemplate<C = any> = Type<C> | DynamicComponent<C>;

type ComponentInput<T> = InputSignal<T>;
type ComponentOutput<T> = OutputRef<T>;

export type ComponentInputs<TCom> = { [K in keyof TCom as TCom[K] extends ComponentInput<any> ? K : never]: TCom[K] extends ComponentInput<infer TInput> ? TInput : never };
export type ComponentOutputHandler<TCom, TEvent = any> = (source: ComponentRef<TCom>, e: TEvent) => void | Promise<void>;
export type ComponentOutputs<TCom> = {
    [K in keyof TCom as TCom[K] extends ComponentOutput<any> ? K : never]: TCom[K] extends ComponentOutput<infer TOutput> ? TOutput : never;
};

export type DynamicComponent<TCom = any> = {
    component: Type<TCom>;
    injector?: Injector;
    /**
     * @description css class to apply to the component
     */
    class?: string;
    /**
     * @description a record object of inputs to set on the component
     */
    inputs?: Partial<ComponentInputs<TCom>>;
    /**
     * @description a record object of outputs to listen to on the component. source parameter is the component reference itself and e is the event emitted.
     */
    outputs?: { [K in keyof ComponentOutputs<TCom>]?: ComponentOutputHandler<ComponentRef<TCom>, ComponentOutputs<TCom>[K]> };

    /**
     * @description a record object of content nodes to project inside the component
     */
    content?: ContentNode[][];
};

export function component(template: DynamicTemplate): DynamicComponent {
    if (!template) throw new Error("Template is required");
    if ("component" in template) return template;
    return { component: template };
}

export function provideComponent<T>(template: DynamicTemplate<T>): DynamicComponent<T> {
    return component(template);
}
