import { DOCUMENT } from '@angular/common';
import { EnvironmentInjector, Type, input, createComponent, TemplateRef, Injector, ComponentRef } from '@angular/core';
import { RouteFeature } from './route-feature';
import { PortalComponent } from '../portal.component';
import { ContentNode } from './content-node';
import { createContentNodes } from './create-content-nodes';

/**
 * a wrapper for function @angular/core:createComponent that enables dynamic projection of content nodes to the component.
 * @param component
 * @param options
 * @returns
 */
export function provideComponent(
    component: Type<any>,
    options: {
        environmentInjector: EnvironmentInjector;

        inputs?: Record<string, any>;
        projectableNodes?: ContentNode[][];

        injector?: Injector;
        hostElement?: Element;
        elementInjector?: Injector;
    },
) {
    const _options = { ...options };

    const inputs = _options.inputs ?? {};
    delete _options.inputs;

    const projectableNodes = createContentNodes(_options.projectableNodes, _options.environmentInjector);
    const ref = createComponent(component, { ..._options, projectableNodes });

    for (const [key, value] of Object.entries(inputs)) {
        ref.setInput(key, value);
    }
    ref.changeDetectorRef.detectChanges();

    return ref;
}

export function createContentNode(content: ContentNode, environmentInjector: EnvironmentInjector | null): Node {
    //native html element
    if (typeof content === 'string') {
        const document = environmentInjector.get(DOCUMENT);
        document.createElement('div').innerHTML = content;
        const div = document.createElement('div');
        div.innerHTML = content;
        return div;
    }

    // create template
    if (content instanceof TemplateRef) {
        const viewRef = content.createEmbeddedView(content.elementRef.nativeElement);
        return viewRef.rootNodes[0];
    }

    if (content instanceof ComponentRef) return content.location.nativeElement;

    // create component (and set inputs if necessary)
    let componentRef: ComponentRef<any>;
    if ('component' in content) componentRef = provideComponent(content.component, { environmentInjector, inputs: content.inputs, projectableNodes: content.content });
    else componentRef = provideComponent(content, { environmentInjector });

    return componentRef.location.nativeElement;
}

/**
 * Set inputs on the component.
 * @param inputs The inputs to set on the component.
 * @returns
 */
export function withComponentInputs(inputs: Record<string, any>): RouteFeature {
    return {
        name: 'withComponentInputs',
        modify: () => ({ data: input }),
    };
}

/**
 * Project content nodes to the component. This feature must be the last feature in the list of features. The wrapped component will skip hydration.
 * @param projectedNodes The content nodes to project to the component.
 * @returns
 */
export function withContentProjection(projectedNodes: ContentNode[][]): RouteFeature {
    return {
        name: 'withContentProjection',
        modify: (route) => ({
            sealed: true,
            component: PortalComponent, // override route.component
            data: {
                component: route.component,
                content: projectedNodes,
                inputs: route.data,
            },
        }),
    };
}
