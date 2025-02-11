import { Injectable, inject, Injector, runInInjectionContext, computed } from "@angular/core";
import { Route, Router } from "@angular/router";
import { RouteFeature } from "./route-feature";

export type HierarchicalRoute = Route & { parent?: HierarchicalRoute };

@Injectable({
    providedIn: "root",
})
export class RouteNavigator {
    injector = inject(Injector);
    router = inject(Router);
    routes: Route[] = [];

    private _flat: Record<string, HierarchicalRoute>;

    private _flatten(routes: Route[], parent: Route = null) {
        for (const route of routes) {
            const key = route.data?.["navigation"] ?? route["name"];
            const _route = { ...route, parent };
            if (key) this._flat[key] = _route;
            if (route.children) {
                this._flatten(route.children, _route);
            }
        }
    }

    private _path(route: string) {
        let result = "";
        let current = this._flat[route];
        while (current) {
            result = current.path + "/" + result;
            current = current.parent;
        }
        return result;
    }

    private _generateParams(route: string, key: string) {
        let result = undefined;
        let current = this._flat[route];
        while (current) {
            if (current.data?.["paramGenerator"]?.[key]) {
                result = current.data["paramGenerator"][key]();
                break;
            }
            current = current.parent;
        }
        return result;
    }

    link(route: string, data: Record<string, any>) {
        return runInInjectionContext(this.injector, () => this._get(route, data));
    }
    _get(route: string, data: Record<string, any>) {
        if (!this._flat) {
            this._flat = {};
            this._flatten(this.router.config);
        }
        const _data = { ...data };
        const path = this._path(route);
        if (!path) return undefined;

        let result = "";
        const segments = path.split("/").filter((x) => x);
        for (const segment of segments) {
            if (segment.startsWith(":")) {
                const key = segment.slice(1);
                const value = _data[key] ?? this._generateParams(route, key);
                if (value === undefined) throw new Error(`Missing parameter ${key} for route ${route}`);
                result += value + "/";
                delete _data[key];
            } else result += segment + "/";
        }

        let query = "";
        for (const key in _data) {
            query += `${key}=${_data[key]}&`;
        }

        if (result && query) result += "?" + query;
        return `/${result}`;
    }

    to(route: string, data: Record<string, any>) {
        const link = this.link(route, data);
        return this.router.navigateByUrl(link);
    }
}

/**
 * Will return a computed value that will generate a link to the specified route
 */
export function routerLink(computation: (navigator: RouteNavigator) => string) {
    const nav = inject(RouteNavigator);
    return computed(() => computation(nav));
}

export function withParamGenerator(paramGenerator: Record<string, () => string>): RouteFeature {
    return {
        name: "withPageMetadata",
        modify: () => {
            return {
                data: {
                    paramGenerator,
                },
            };
        },
    };
}
