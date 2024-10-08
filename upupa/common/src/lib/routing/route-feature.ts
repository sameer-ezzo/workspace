import { inject } from "@angular/core";
import { Route } from "@angular/router";
import { RESPONSE } from "../ssr/http-tokens";
import { Response } from "express";

/**
 * RouteFeature is a modifier function that takes a route object and returns a modified route object. The resulted route will be merged with the original route object, so only the properties to be mixed.
 * @param route base route object
 * @returns only the properties to be introduced to base route object
 */
export type RouteFeature = (route: Route) => Partial<Route>;

function applyRouteFeature(route: Route, modifier: RouteFeature): Route {
    const modifiedRoute = modifier(route);

    const data = { ...route.data, ...modifiedRoute.data };
    const resolve = { ...route.resolve, ...modifiedRoute.resolve };
    const providers =
        modifiedRoute.providers && route.providers
            ? route.providers.concat(modifiedRoute.providers)
            : modifiedRoute.providers || route.providers;
    const children =
        modifiedRoute.children && route.children ? route.children.concat(modifiedRoute.children) : modifiedRoute.children || route.children;

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
export function provideRoute(route: Partial<Route & { name: string }>, ...features: RouteFeature[]): Route;
export function provideRoute(name: string, route: Partial<Route>, ...features: RouteFeature[]): Route;
export function provideRoute(
    nameOrRoute: string | Partial<Route & { name: string }>,
    featureOrRoute: Partial<Route & { name: string }> | RouteFeature,
    ..._features: RouteFeature[]
): Route {
    let route = typeof nameOrRoute === "string" ? { ...featureOrRoute, name: nameOrRoute } : nameOrRoute;
    const features = typeof nameOrRoute === "string" ? _features : [featureOrRoute, ..._features] as RouteFeature[];

    for (const modifier of features) {
        route = applyRouteFeature(route, modifier);
    }
    return route;
}

