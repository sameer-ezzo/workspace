import { Type } from "@angular/core";
import { Route } from "@angular/router";
import { Observable } from "rxjs";
import { CpLayoutComponent } from "./cp-layout/cp-layout.component";
import { DataListComponent } from "./data-list/data-list.component";
import { mergeScaffoldingScheme } from "./decorators/decorator.types";
import { SCAFFOLDING_SCHEME, CP_SIDE_BAR_ITEMS } from "./di.token";
import { SideBarViewModel } from "./side-bar-group-item";



export function layoutRoute(options: {
    layout?: Type<CpLayoutComponent>;
    sidebar: SideBarViewModel | { useFactory: (...args: any[]) => SideBarViewModel | Promise<SideBarViewModel> | Observable<SideBarViewModel>; deps?: any[]; };
}, route: Omit<Route, 'component'>): Route {
    return {
        ...route,
        component: options.layout ?? CpLayoutComponent,
        providers: [
            { provide: SCAFFOLDING_SCHEME, useValue: mergeScaffoldingScheme() },
            Array.isArray(options.sidebar) ? { provide: CP_SIDE_BAR_ITEMS, useValue: options.sidebar } : { provide: CP_SIDE_BAR_ITEMS, useFactory: options.sidebar.useFactory, deps: options.sidebar.deps },
        ],
        data: {
            ...route.data,
            ...options
        }
    };
}
export function layoutListRoute(options: { component?: Route['component']; } = { component: DataListComponent },
    route: Omit<Route, 'component'>): Route {
    if (!options) options = { component: DataListComponent };
    if (!options.component) options.component = DataListComponent;
    return {
        ...route,
        component: options.component,
        runGuardsAndResolvers: 'pathParamsChange'
    };
}
