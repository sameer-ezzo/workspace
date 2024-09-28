import { Type } from "@angular/core";
import { Route } from "@angular/router";
import { Observable } from "rxjs";
import { CpLayoutComponent } from "./cp-layout/cp-layout.component";
import { DataListComponent } from "./data-list/data-list.component";
import { SCAFFOLDING_SCHEME, CP_SIDE_BAR_ITEMS } from "./di.token";
import { SideBarViewModel } from "./side-bar-group-item";
import { mergeScaffoldingScheme } from "./decorators/scheme.router.decorator";



export function layoutRoute(layout: {
    layout?: Type<CpLayoutComponent>;
    sidebar: SideBarViewModel | { useFactory: (...args: any[]) => SideBarViewModel | Promise<SideBarViewModel> | Observable<SideBarViewModel>; deps?: any[]; };
}, route: Omit<Route, 'component'>): Route {
    return {
        ...route,
        component: layout.layout ?? CpLayoutComponent,
        providers: [
            { provide: SCAFFOLDING_SCHEME, useValue: mergeScaffoldingScheme() },
            Array.isArray(layout.sidebar) ? { provide: CP_SIDE_BAR_ITEMS, useValue: layout.sidebar } : { provide: CP_SIDE_BAR_ITEMS, useFactory: layout.sidebar.useFactory, deps: layout.sidebar.deps },
        ],
        data: {
            ...route.data,
            ...layout
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
