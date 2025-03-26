import { makeEnvironmentProviders } from "@angular/core";
import { APIBASE } from "./di.token";
import { DataConfig } from "./model";
import { DOCUMENT } from "@angular/common";

export function provideApi(api_base: string, config?: DataConfig) {
    return makeEnvironmentProviders([
        {
            provide: APIBASE,
            useFactory: (doc: Document) => {
                api_base = (api_base.length ? api_base : "/api").trim().toLocaleLowerCase();
                if (api_base.startsWith("http")) return api_base;
                const base = `${doc.location.protocol}//${doc.location.hostname}`;
                const url = new URL(api_base, base).toString();
                return url;
            },
            deps: [DOCUMENT],
        },
        {
            provide: DataConfig,
            useValue: config,
        },
    ]);
}
