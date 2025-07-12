import { makeEnvironmentProviders, DOCUMENT } from "@angular/core";
import { APIBASE } from "./di.token";
import { DataConfig } from "./model";


type ProviderValue<T = string> = T | (() => T | Promise<T>);
export function provideApi(api_base: ProviderValue, config?: DataConfig) {
    return makeEnvironmentProviders([
        {
            provide: APIBASE,
            useFactory: async (doc: Document) => {
                const fn = typeof api_base === "function" ? api_base : () => api_base;
                const url = ((await fn()) ?? "/api").trim();
                if (url.startsWith("http")) return url;
                const base = doc.location.origin;
                const apiUrl = new URL(url, base).toString();
                return apiUrl;
            },
            deps: [DOCUMENT],
        },
        {
            provide: DataConfig,
            useValue: config,
        },
    ]);
}
