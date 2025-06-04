import { Provider, EnvironmentProviders, makeEnvironmentProviders, InjectionToken, inject, provideAppInitializer, runInInjectionContext, Injector } from "@angular/core";
import { MetadataService } from "./metadata.service";
import { OpenGraphConfig, OpenGraphMetadataStrategy } from "./strategies/open-graph.strategy";
import { ContentMetadataConfig, PageMetadataStrategy } from "./strategies/page-metadata.strategy";
import { TwitterCardConfig, TwitterCardMetadataStrategy } from "./strategies/twitter.strategy";
import { ActivatedRoute } from "@angular/router";
import { SchemaOrgConfig, SchemaOrgMetadataStrategy } from "./strategies/schema-org.strategy";

export const CONTENT = new InjectionToken("CONTENT");

export type MetaProviderConfig<C> = C | (() => C | Promise<C>);

/**
 * Provide the page metadata configuration
 * @param config
 * @param features
 * @returns
 */
export function providePageMetadata(config: MetaProviderConfig<ContentMetadataConfig>, ...features: (Provider | EnvironmentProviders)[]) {
    const configFn = typeof config === "function" ? config : () => Promise.resolve(config);

    return makeEnvironmentProviders([
        { provide: CONTENT, useFactory: (route: ActivatedRoute) => route.snapshot.data["content"], deps: [ActivatedRoute] },

        ...features,
        provideAppInitializer(async () => {
            const metaService = inject(MetadataService);
            const injector = inject(Injector);
            return await runInInjectionContext(injector, async () => {
                const c = await configFn();
                const pageMetaService = runInInjectionContext(injector, () => new PageMetadataStrategy(c));
                metaService.defineMetadataUpdateStrategy(pageMetaService);
                await metaService.initialize(c);
            });
        }),
    ]);
}

/**
 * Provide the Twitter Card configuration
 * @param config
 * @returns
 */
export function withTwitterCard(config: MetaProviderConfig<TwitterCardConfig>) {
    const configFn = typeof config === "function" ? config : () => Promise.resolve(config);
    return makeEnvironmentProviders([
        provideAppInitializer(async () => {
            const injector = inject(Injector);

            return await runInInjectionContext(injector, async () => {
                const metaService = inject(MetadataService);
                const c = await configFn();
                const twitterService = runInInjectionContext(injector, () => new TwitterCardMetadataStrategy(c));
                metaService.defineMetadataUpdateStrategy(twitterService);
            });
        }),
    ]);
}

/**
 * Provide the Open Graph configuration
 * @param config
 * @returns
 */
export function withOpenGraph(config: MetaProviderConfig<OpenGraphConfig>) {
    const configFn = typeof config === "function" ? config : () => Promise.resolve(config);
    return makeEnvironmentProviders([
        provideAppInitializer(async () => {
            const injector = inject(Injector);

            return await runInInjectionContext(injector, async () => {
                const metaService = inject(MetadataService);
                const c = await configFn();
                const ogService = runInInjectionContext(injector, () => new OpenGraphMetadataStrategy(c));
                metaService.defineMetadataUpdateStrategy(ogService);
            });
        }),
    ]);
}

export function withSchemaOrg(config: MetaProviderConfig<SchemaOrgConfig>) {
    const configFn = typeof config === "function" ? config : () => Promise.resolve(config);
    return makeEnvironmentProviders([
        provideAppInitializer(async () => {
            const injector = inject(Injector);
            return await runInInjectionContext(injector, async () => {
                const metaService = inject(MetadataService);
                const c = await configFn();
                const schemaService = runInInjectionContext(injector, () => new SchemaOrgMetadataStrategy(c));
                metaService.defineMetadataUpdateStrategy(schemaService);
            });
        }),
    ]);
}
