import { HttpClient } from "@angular/common/http";
import { inject, Signal, Type } from "@angular/core";
import { ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { firstValueFrom, Observable } from "rxjs";

export type ResolverRequest = { route: ActivatedRouteSnapshot, state: RouterStateSnapshot }
export type ResolverResult<T = any> = T | Promise<T> | Observable<T> | Signal<T>;

export function resolverFactory<T extends Record<string, Type<any>>>(deps: T, resolve: (resolveRequest: ResolverRequest & { [K in keyof T]: any }) => ResolverResult) {
    return async (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
        const injected = {} as any
        for (const key in deps) {
            injected[key] = inject(deps[key])
        }

        const result = await resolve({ route, state, ...injected });
        if (typeof result === 'function') return result()
        if ('subscribe' in result) return firstValueFrom(result)
        return result
    }
}

export function httpResolverFactory<T>(callback: (resolveRequest: ResolverRequest & { http: HttpClient }) => ResolverResult<T>) {
    return resolverFactory({ http: HttpClient }, callback)
}


export function resolve<T>(url: (resolveRequest: ResolverRequest) => string, options?: { headers?: { [header: string]: string } }) {
    return httpResolverFactory<T>(({ http, route, state }) => http.get<T>(url({ route, state }), options))
}

export function contentResolver<T>(url: (resolveRequest: ResolverRequest) => string, options?: { headers?: { [header: string]: string } }) {
    return {
        content: resolve<T>(url, options)
    }
}