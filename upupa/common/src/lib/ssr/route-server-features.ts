import { inject } from "@angular/core";
import { Route } from "@angular/router";
import { RouteFeature, provideRoute } from "../routing/route-feature";
import { RESPONSE } from "./http-tokens";
import { Response } from "express";

/**
 * In server platform, set the http status code for the route
 * @param status the http status code to be set
 * @returns
 */
export function withHttpStatus(status: number): RouteFeature {
    return {
        name: "withHttpStatus",
        modify: (route) => ({
            canActivate: [
                () => {
                    const res = inject(RESPONSE, { optional: true });
                    if (res) {
                        res.status(status);
                    }
                    return true;
                },
                ...(route.canActivate ?? []),
            ],
        }),
    };
}

/**
 * Control the response object in the route for server platform
 * @param callback
 * @returns
 */
export function withHttpResponse(callback: (res: Response) => void): RouteFeature {
    return {
        name: "withHttpResponse",
        modify: (route) => ({
            canActivate: [
                () => {
                    const res = inject(RESPONSE, { optional: true });
                    if (res) callback(res);
                    return true;
                },
                ...(route.canActivate ?? []),
            ],
        }),
    };
}

/**
 * Make the redirection work in ssr
 * @param route
 * @returns
 */
export function provideRouteRedirect(route: Pick<Route, "path" | "redirectTo"> & { name?: string; status?: 302 | 301 }): Route {
    const status = (route.status ??= 302);

    return {
        path: route.path,
        redirectTo: (redirectData) => {
            const res = inject(RESPONSE, { optional: true });
            const redirectTo = typeof route.redirectTo === "function" ? route.redirectTo(redirectData) : route.redirectTo;
            if (res) {
                const url = typeof redirectTo === "string" ? redirectTo : (redirectTo?.toString() ?? "/");
                res.redirect(status, url);
                res.end();
                return null;
            }
            return redirectTo;
        },
    } as Route;
}

export function provideRouteNotfound(route: Route & { name?: string }): Route {
    return provideRoute(route, withHttpStatus(404));
}
