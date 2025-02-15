import { ResolveFn, Route, RouterOutlet } from "@angular/router";
import { ComponentInputs, DynamicComponent } from "../dynamic-component";
import { ActionDescriptor } from "../action-descriptor";

export type NamedRoute = Route & { name: string };
export type DynamicComponentRoute<T = any> = Omit<NamedRoute, "component" | "resolve"> & {
    component: DynamicComponent<T>;
    resolve: { [key in keyof ComponentInputs<T>]?: ResolveFn<unknown> } & Record<string, ResolveFn<unknown>>;
    data: { [key in keyof ComponentInputs<T>]?: any } & Record<string, any>;
};

/**
 * RouteFeature is a modifier function that takes a route object and returns a modified route object. The resulted route will be merged with the original route object, so only the properties to be mixed.
 * @param route base route object
 * @returns only the properties to be introduced to base route object
 */
export type RouteFeature = {
    name: string;
    modify(route: Route): Partial<Route>;
};

function applyRouteFeature(route: Route & { sealed?: boolean }, feature: RouteFeature): Route {
    if (route.sealed)
        throw new Error(`Previous feature has sealed the route object and no more features can be applied. Please move this feature [${feature.name}] to proceed it.`);
    const modifiedRoute = feature.modify(route);

    const data = { ...route.data, ...modifiedRoute.data };
    const resolve = { ...route.resolve, ...modifiedRoute.resolve };
    const providers = modifiedRoute.providers && route.providers ? route.providers.concat(modifiedRoute.providers) : modifiedRoute.providers || route.providers;
    const children = modifiedRoute.children && route.children ? route.children.concat(modifiedRoute.children) : modifiedRoute.children || route.children;

    const newRoute = {
        ...route,
        ...modifiedRoute,
        data,
        resolve,
        children,
        providers,
    };

    return newRoute;
}

/**
 * build a route object with extended features
 * @param route route object
 * @param features the route modifiers to applied
 * @returns route objected with all features merged and applied.
 */
export function provideRoute<T = any>(route: Partial<NamedRoute | DynamicComponentRoute<T>>, ...features: RouteFeature[]): Route;
export function provideRoute<T = any>(name: string, route: Partial<NamedRoute | DynamicComponentRoute<T>>, ...features: RouteFeature[]): Route;
export function provideRoute<T = any>(
    nameOrRoute: string | Partial<NamedRoute | DynamicComponentRoute<T>>,
    featureOrRoute: Partial<Route & { name: string }> | RouteFeature,
    ..._features: RouteFeature[]
): Route {
    let _route = typeof nameOrRoute === "string" ? { ...featureOrRoute, name: nameOrRoute } : nameOrRoute;
    let features = typeof nameOrRoute === "string" ? _features : ([featureOrRoute, ..._features] as RouteFeature[]);
    features = features.filter((f) => f); // remove undefined features

    let route = _route as Route;
    if (isDynamicComponentRoute(_route)) {
        const dynamicComponent = _route.component;
        route.component = dynamicComponent.component;
        route.data = { ...route.data, ...dynamicComponent.inputs, outputs: dynamicComponent.outputs };
    }

    for (const modifier of features) {
        route = applyRouteFeature(route as any, modifier);
    }
    return route as any;
}

function isDynamicComponentRoute(route: Partial<NamedRoute | DynamicComponentRoute>): route is DynamicComponentRoute {
    return !!(route as any).component?.component;
}

export function withAction(
    action: Omit<ActionDescriptor, "name"> & {
        action: string;
        name?: string;
        path?: string;
        group?: string | { name?: string; text?: string; expanded?: boolean; icon?: string };
    },
): RouteFeature {
    return {
        name: "withAction",
        modify(route) {
            return {
                data: { ...route.data, action },
            };
        },
    };
}

import { APP_INITIALIZER, ComponentRef, inject, Injectable, Injector, Provider, reflectComponentType, runInInjectionContext } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Subscription } from "rxjs";

@Injectable({ providedIn: "root" })
export class RouteOutputBinder {
    _map = new Map<ComponentRef<any>, Subscription[]>();

    bindOutputs(activatedRoute: ActivatedRoute, componentRef: ComponentRef<any>): void {
        if (!componentRef) return;

        const outputsConfig = activatedRoute.snapshot.data["outputs"] as Record<string, (...args: any[]) => void>;
        const mirror = reflectComponentType(componentRef.componentType);
        if (outputsConfig) {
            for (const outputName in outputsConfig) {
                if (!mirror.outputs.find((o) => o.templateName == outputName)) continue;

                const output = componentRef.instance[outputName];
                if (output && output.subscribe) {
                    const handler = outputsConfig[outputName];
                    const subscription = output.subscribe((...args: any[]) => {
                        runInInjectionContext(componentRef.injector, () => {
                            handler(componentRef, ...args);
                        });
                    });
                    this._map.set(componentRef, [...(this._map.get(componentRef) || []), subscription]);
                }
            }
        }
    }

    unbindOutputs(componentRef: ComponentRef<any>) {
        if (!componentRef) return;
        if (this._map.has(componentRef)) {
            for (const sub of this._map.get(componentRef)) {
                sub.unsubscribe();
            }
            this._map.delete(componentRef);
        }
    }
}

export function provideRouteOutputBinder(): Provider {
    return {
        provide: APP_INITIALIZER,
        useFactory: (outputBinder: RouteOutputBinder) => () => {
            const originalDeactivate = RouterOutlet.prototype.deactivate;
            const originalActivateWith = RouterOutlet.prototype.activateWith;
            RouterOutlet.prototype.activateWith = function (...args) {
                const res = originalActivateWith.apply(this, args);
                const componentRef = this.activated;
                const [activatedRoute] = args;
                outputBinder.bindOutputs(activatedRoute, componentRef);
                return res;
            };
            RouterOutlet.prototype.deactivate = function (...args) {
                const componentRef = this.activated;
                outputBinder.unbindOutputs(componentRef);
                return originalDeactivate.apply(this, args);
            };
        },
        deps: [RouteOutputBinder],
        multi: true,
    };
}
