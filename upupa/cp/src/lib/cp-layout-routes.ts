import { Type } from "@angular/core";
import { Route } from "@angular/router";
import { Observable } from "rxjs";
import { CpLayoutComponent } from "./cp-layout/cp-layout.component";
import { DataListComponent } from "./data-list/data-list.component";
import { SCAFFOLDING_SCHEME, CP_SIDE_BAR_ITEMS } from "./di.token";
import { SideBarViewModel } from "./side-bar-group-item";
import { mergeScaffoldingScheme } from "./decorators/scheme.router.decorator";
import { RouteFeature } from "@upupa/common";

export function withLayoutComponent(config: {
    layout?: Type<CpLayoutComponent>;
    sidebar: SideBarViewModel | { useFactory: (...args: any[]) => SideBarViewModel | Promise<SideBarViewModel> | Observable<SideBarViewModel>; deps?: any[] };
}): RouteFeature {
    return () => ({
        component: config.layout ?? CpLayoutComponent,
        providers: [
            { provide: SCAFFOLDING_SCHEME, useValue: mergeScaffoldingScheme() },
            Array.isArray(config.sidebar)
                ? { provide: CP_SIDE_BAR_ITEMS, useValue: config.sidebar }
                : { provide: CP_SIDE_BAR_ITEMS, useFactory: config.sidebar.useFactory, deps: config.sidebar.deps },
        ],
    });
}

export function layoutListRoute(options: { component?: Route["component"] } = { component: DataListComponent }, route: Omit<Route, "component">): Route {
    if (!options) options = { component: DataListComponent };
    if (!options.component) options.component = DataListComponent;
    return {
        ...route,
        component: options.component,
        runGuardsAndResolvers: "pathParamsChange",
    };
}
