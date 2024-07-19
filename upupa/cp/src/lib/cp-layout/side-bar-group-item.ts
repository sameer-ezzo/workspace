import { ActionDescriptor } from "@upupa/common";
import { DataListComponent } from "../data-list/data-list.component";
import { Route } from "@angular/router";
import { CP_SIDE_BAR_ITEMS, SCAFFOLDING_SCHEME } from "../di.token";
import { getListScaffolder, mergeScaffoldingScheme } from "../decorators/scheme.router.decorator";
import { ScaffoldingService } from "../scaffolding.service";


export type SideBarItem = ActionDescriptor & {
    link: string;
    queryParams?: any;
    href?: string;
    target?: string;
    external?: boolean;

    component?: any
    scaffolder?: any
};

export type SideBarGroup = { name: string, text: string, items: SideBarItem[] };
export type SideBarViewModel = (SideBarGroup | SideBarItem)[]


export function layoutRoute(options: {
    layout: Route['component'],
    sidebar: SideBarViewModel | { useFactory: (...args: any[]) => SideBarViewModel, deps?: any[]; },
}, route: Omit<Route, 'component'>): Route {
    return {
        ...route,
        component: options.layout,
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
export function layoutListRoute(options: { component?: Route['component'] } = { component: DataListComponent },
    route: Omit<Route, 'component'>): Route {
    if (!options) options = { component: DataListComponent }
    if (!options.component) options.component = DataListComponent
    return {
        ...route,
        component: options.component,
        runGuardsAndResolvers: 'pathParamsChange'
    }
}