import { HttpClient } from "@angular/common/http";
import { inject, Signal, Type } from "@angular/core";
import { ActivatedRouteSnapshot, RedirectCommand, Router, RouterStateSnapshot } from "@angular/router";
import { firstValueFrom, Observable } from "rxjs";

export type ResolverRequest = { route: ActivatedRouteSnapshot; state: RouterStateSnapshot };
export type ResolverResult<T = any> = T | Promise<T> | Observable<T> | Signal<T>;

export function resolverFactory<T extends Record<string, Type<any>>>(deps: T, resolve: (resolveRequest: ResolverRequest & { [K in keyof T]: any }) => ResolverResult) {
    return async (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
        const injected = {} as any;
        for (const key in deps) {
            injected[key] = inject(deps[key]);
        }

        const result = await resolve({ route, state, ...injected });
        if (typeof result === "function") return result();
        if ("subscribe" in result) return firstValueFrom(result);
        return result;
    };
}

export function httpResolverFactory<T>(callback: (resolveRequest: ResolverRequest & { http: HttpClient; router: Router }) => ResolverResult<T>) {
    return resolverFactory({ http: HttpClient, router: Router }, callback);
}

export function resolve<T>(
    url: (resolveRequest: ResolverRequest) => string,
    map = (response) => response,
    options?: { headers?: { [header: string]: string }; notFoundRedirect?: string },
) {
    return httpResolverFactory<T>(async ({ route, state, http, router }) => {
        try {
            const rx = http.get<T>(url({ route, state }), options);
            const response = await firstValueFrom(rx);
            const result = map(response);
            return result;
        } catch (error) {
            console.error("Error resolving content", error);
            if (error.status === 404) {
                const notFoundRedirect = options?.notFoundRedirect ?? "/not-found";
                return new RedirectCommand(router.parseUrl(notFoundRedirect)) as any;
            }
        }
    });
}

export function contentResolver<T>(url: (resolveRequest: ResolverRequest) => string, map = (response) => response, options?: { headers?: { [header: string]: string } }) {
    return {
        content: resolve<T>(url, map, options),
    };
}
