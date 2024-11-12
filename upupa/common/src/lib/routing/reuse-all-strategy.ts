import { Injectable, Type } from "@angular/core";
import { RouteReuseStrategy, ActivatedRouteSnapshot, DetachedRouteHandle } from "@angular/router";


@Injectable()
export class ReuseAllStrategy implements RouteReuseStrategy {

    storedRoutes: {
        [key: string]: {
            snapshot: ActivatedRouteSnapshot;
            handle: DetachedRouteHandle;
        };
    } = {};



    shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
        if (!future.routeConfig) return false;
        return future.routeConfig === curr.routeConfig;
    }

    shouldAttach(route: ActivatedRouteSnapshot): boolean {
        const path = route.url.join("/");
        if (!path) return false;

        const canAttach = !!route.routeConfig && !!this.storedRoutes[path];
        if (canAttach) {
            //return paramsMatch && queryParamsMatch;
            return true;
        }

        return false;
    }


    shouldDetach(route: ActivatedRouteSnapshot): boolean {
        if (!route.routeConfig) return false;
        return true;
    }

    store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle): void {
        const path = route.url.join("/");
        this.storedRoutes[path] = { snapshot: route, handle: handle };
    }

    _lastRetrieved: ActivatedRouteSnapshot | null = null;
    retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle {
        if (!route.routeConfig || !route.routeConfig?.path) throw new Error("Route path not found");
        const path = route.url.join("/");

        if (!this.storedRoutes[path]) throw new Error("Route not found");

        const stored = this.storedRoutes[path];
        if (this._lastRetrieved !== route) { // avoid logging for the same route multiple times
            console.info("Reusing Component: ", stored.snapshot.component?.name);
        }
        this._lastRetrieved = route;

        return stored.handle;
    }
}


export function provideReuseStrategy<T extends RouteReuseStrategy>(reuseStrategy: Type<T>) {
    return {
        provide: RouteReuseStrategy,
        useClass: reuseStrategy
    }
}

export function provideReuseAllStrategy() {
    return provideReuseStrategy(ReuseAllStrategy)
}