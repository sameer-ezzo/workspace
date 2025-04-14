import { Type } from "@angular/core";
import { Route, Routes } from "@angular/router";
import { Observable } from "rxjs";
import { CpLayoutComponent } from "./cp-layout/cp-layout.component";
import { CP_SIDE_BAR_ITEMS } from "./di.token";
import { SideBarGroup, SideBarViewModel } from "./side-bar-group-item";
import { DynamicComponent, provideRoute, RouteFeature } from "@upupa/common";

export type LayoutConfig = {
    layout?: Type<CpLayoutComponent>;
    logo?: string;
    sidebar: SideBarViewModel | { useFactory: (...args: any[]) => SideBarViewModel | Promise<SideBarViewModel> | Observable<SideBarViewModel>; deps?: any[] };
    topbar?: (DynamicComponent | "spacer")[];
    loginUrl?: string;
};

export function provideLayoutRoute(config: Omit<Route, "component"> & LayoutConfig, ...features: RouteFeature[]): Route {
    return provideRoute(config, withLayoutComponent(config), ...features);
}

export function withLayoutComponent(config: LayoutConfig): RouteFeature {
    return {
        name: "withLayoutComponent",
        modify: () => ({
            component: config.layout ?? CpLayoutComponent,
            data: {
                logo: config.logo,
                loginUrl: config.loginUrl,
                topBarItems: config.topbar,
            },
            providers: [
                Array.isArray(config.sidebar)
                    ? { provide: CP_SIDE_BAR_ITEMS, useValue: config.sidebar }
                    : { provide: CP_SIDE_BAR_ITEMS, useFactory: config.sidebar.useFactory, deps: config.sidebar.deps },
            ],
        }),
    };
}

export type FlattenedRoutes = Record<string, Route>;
function flattenRoutes(routes: Routes, basePath = "/"): FlattenedRoutes {
    const result: FlattenedRoutes = {};
    for (const route of routes) {
        if (route.children?.length) {
            Object.assign(result, flattenRoutes(route.children, basePath + route.path + "/"));
        } else {
            result[basePath + route.path] = route;
        }
    }
    return result;
}

export function routesToActions(routes: Routes, basePath = "/"): SideBarViewModel {
    const flattenedRoutes = Object.entries(flattenRoutes(routes, basePath));
    const routesWithAction = flattenedRoutes.filter(([_, route]) => route.data?.["action"]);
    const routesWithGroup = routesWithAction.filter(([_, route]) => route.data["action"].group);
    const sideBar: SideBarViewModel = [];
    const groups = routesWithGroup.map(([_, route]) => {
        const g = route.data["action"].group;
        if (typeof g === "string") {
            return { name: g, text: g, items: [] } as SideBarGroup;
        }
        return { ...g, items: [] };
    });

    const groupMap = new Map<string, SideBarGroup>();
    for (const group of groups) {
        if (!groupMap.has(group.name)) groupMap.set(group.name, group);
    }

    for (const [path, route] of routesWithAction) {
        const groupName = typeof route.data["action"].group === "string" ? route.data["action"].group : route.data["action"].group?.name;

        if (groupName) {
            const group = groupMap.get(groupName);
            group.items.push({
                name: route.data["action"].action ?? path,
                link: path,
                icon: route.data["action"].icon,
                text: route.data["action"].text,
                path: route.data["action"].path, // added path for permission check
                action: route.data["action"].action, //  added actoin for permission check
            });
            // check if group is already in sidebar
            if (!sideBar.includes(group)) {
                sideBar.push(group);
            }
        } else {
            sideBar.push({
                name: route.data["action"].action ?? path,
                link: path,
                icon: route.data["action"].icon,
                text: route.data["action"].text,
                path: route.data["action"].path, // added path for permission check
                action: route.data["action"].action, // added actoin for permission check
            });
        }
    }
    return sideBar;
}
