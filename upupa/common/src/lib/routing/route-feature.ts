import {
    ActivatedRouteSnapshot,
    ActivationEnd,
    ActivationStart,
    ChildActivationEnd,
    ChildActivationStart,
    GuardsCheckEnd,
    GuardsCheckStart,
    InMemoryScrollingOptions,
    Navigation,
    NavigationCancel,
    NavigationEnd,
    NavigationError,
    NavigationSkipped,
    NavigationStart,
    provideRouter,
    RedirectCommand,
    ResolveEnd,
    ResolveFn,
    ResolveStart,
    Route,
    RouteConfigLoadEnd,
    RouteConfigLoadStart,
    Router,
    RouterConfigOptions,
    RouterEvent,
    RouterFeatures,
    Routes,
    RoutesRecognized,
    Scroll,
    withComponentInputBinding,
    withDebugTracing,
    withInMemoryScrolling,
    withNavigationErrorHandler,
    withRouterConfig,
    withViewTransitions,
} from "@angular/router";
import { ComponentInputs, DynamicComponent } from "../dynamic-component";
import { ActionDescriptor } from "../action-descriptor";
import { makeEnvironmentProviders, provideAppInitializer, inject, EnvironmentProviders, Injector, runInInjectionContext, Type, output } from "@angular/core";
import { provideRouteOutputBinder } from "./route-output-binder";

export type NamedRoute = Route & { name?: string };
export type DynamicComponentRoute<T = any> = Omit<NamedRoute, "component" | "resolve"> & {
    component: Type<T>;
    resolve?: { [key in keyof ComponentInputs<T>]?: ResolveFn<unknown> } & Record<string, ResolveFn<unknown>>;
    data?: { [key in keyof ComponentInputs<T>]?: any } & Record<string, any>;
    outputs?: Pick<DynamicComponent<T>, "outputs">;
    on?: (event: RouterEvent, snapshot: ActivatedRouteSnapshot) => void;
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
    route.runGuardsAndResolvers ??= "always";
    if ("outputs" in route && route.outputs) route.data = { ...route.data, outputs: route.outputs };

    for (const modifier of features) {
        route = applyRouteFeature(route, modifier);
    }
    return route as any;
}

export function withAction(
    action: Omit<ActionDescriptor, "name"> & {
        action: string;
        name?: string;
        path?: string;
        group?: string | { name?: string; text?: string; expanded?: boolean; icon?: string, action?: string };
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

function flattenRouterSnapshot(route: ActivatedRouteSnapshot): ActivatedRouteSnapshot[] {
    const routes: ActivatedRouteSnapshot[] = [];
    routes.push(route);
    for (const child of route.children) {
        routes.push(...flattenRouterSnapshot(child));
    }
    return routes;
}

type Event =
    | NavigationStart
    | NavigationEnd
    | NavigationCancel
    | NavigationError
    | RoutesRecognized
    | GuardsCheckStart
    | GuardsCheckEnd
    | RouteConfigLoadStart
    | RouteConfigLoadEnd
    | ChildActivationStart
    | ChildActivationEnd
    | ActivationStart
    | ActivationEnd
    | Scroll
    | ResolveStart
    | ResolveEnd
    | NavigationSkipped;

export type EnhancedRouterConfig = RouterConfigOptions & {
    withComponentInputBinding?: boolean;
    withInMemoryScrolling?: InMemoryScrollingOptions;
    withViewTransitions?: boolean;
    withDebugTracing?: boolean;
    withNavigationErrorHandler?: (error: NavigationError) => unknown | RedirectCommand;
    withRouteOutputBinder?: boolean;
    withEventHandler?: (event: Event, route?: ActivatedRouteSnapshot) => void;
};

const DEFAULT_ROUTER_CONFIG: EnhancedRouterConfig = {
    withComponentInputBinding: true,
    withInMemoryScrolling: { anchorScrolling: "enabled" },
    withViewTransitions: typeof document !== "undefined" && document.visibilityState === "visible", //enable view transitions on browser (not headless)
    withDebugTracing: false,
    withNavigationErrorHandler: (error) => {
        console.error(error);
        return null;
    },
    withRouteOutputBinder: true,
};
export function provideEnhancedRouting(routes: Routes, config: EnhancedRouterConfig = DEFAULT_ROUTER_CONFIG) {
    const _config = { ...DEFAULT_ROUTER_CONFIG, ...config };
    // TODO add reuse strategy and preloading strategy config
    const features: RouterFeatures[] = [withRouterConfig(_config)];
    const additionalProviders: EnvironmentProviders[] = [];

    if (_config.withInMemoryScrolling) {
        features.push(
            withInMemoryScrolling({
                anchorScrolling: "enabled",
                ...withInMemoryScrolling,
                get scrollPositionRestoration() {
                    if (typeof window === "undefined") return "disabled";
                    const navigation = window["_navigation"] as Navigation;
                    return navigation?.extras.info?.["scrollPositionRestoration"] ?? "enabled";
                },
            }),
        );
    }

    if (_config.withComponentInputBinding) {
        features.push(withComponentInputBinding());
    }
    if (_config.withViewTransitions) {
        // withRichViewTransitionsService(),
        features.push(withViewTransitions());
    }

    if (_config.withDebugTracing) {
        features.push(withDebugTracing());
    }

    if (_config.withNavigationErrorHandler) {
        features.push(withNavigationErrorHandler(_config.withNavigationErrorHandler));
    }

    if (_config.withRouteOutputBinder) {
        additionalProviders.push(provideRouteOutputBinder());
    }

    return makeEnvironmentProviders([
        provideAppInitializer(async () => {
            const injector = inject(Injector);
            const router = inject(Router);
            router.events.subscribe((event) => {
                if (typeof window !== "undefined" && event instanceof NavigationEnd) {
                    window["_navigation"] = router.getCurrentNavigation();
                }

                if ("state" in event) {
                    const snapshots = flattenRouterSnapshot(event.state.root);
                    runInInjectionContext(injector, () => {
                        for (const snapshot of snapshots) {
                            _config.withEventHandler?.(event, snapshot);
                        }
                    });

                    for (const snapshot of snapshots.filter((r) => r.routeConfig?.["on"])) {
                        const on = snapshot.routeConfig["on"];
                        if (typeof on === "function") {
                            try {
                                on(event, snapshot);
                            } catch (e) {
                                console.error("Error in route event handler:", e);
                            }
                        }
                    }
                } else runInInjectionContext(injector, () => _config.withEventHandler?.(event));
            });
        }),
        provideRouter(routes, ...features),
        ...additionalProviders,
    ]);
}
