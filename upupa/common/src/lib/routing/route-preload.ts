import { Injectable } from "@angular/core";
import { PreloadingStrategy, Route } from "@angular/router";
import { Observable, of } from "rxjs";

@Injectable({ providedIn: 'root' })
export class PreloadingStrategyService extends PreloadingStrategy {

    preloadedRoutes: string[] = []

    override preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
        const path = route.path ?? ''
        const preloadHint = route.data?.["preloadHint"] ?? false

        if (preloadHint) {
            console.log('Preloading route:', path)
            this.preloadedRoutes.push(path)
            return load()
        }
        else return of(null)
    }

}

export function providePreloadingStrategy() {
    return {
        provide: PreloadingStrategy,
        useClass: PreloadingStrategyService
    }
}