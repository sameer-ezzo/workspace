import { Provider, EnvironmentProviders, makeEnvironmentProviders, InjectionToken, FactoryProvider, inject, provideAppInitializer } from "@angular/core";
import { MetadataService, PAGE_METADATA_STRATEGIES } from "./metadata.service";
import { OPEN_GRAPH_CONFIG, OpenGraphConfig, OpenGraphMetadataStrategy } from "./strategies/open-graph.strategy";
import { ContentMetadataConfig, PAGE_METADATA_CONFIG, PageMetadataStrategy } from "./strategies/page-metadata.strategy";
import { TWITTER_CARD_CONFIG, TwitterCardConfig, TwitterCardMetadataStrategy } from "./strategies/twitter.strategy";
import { ActivatedRoute } from "@angular/router";
import { SCHEMA_ORG_METADATA_CONFIG, SchemaOrgConfig, SchemaOrgMetadataStrategy } from "./strategies/schema-org.strategy";

export const CONTENT = new InjectionToken("CONTENT");

export function initializeMetData(metaService: MetadataService) {
    return async () => {
        metaService.listenForRouteChanges();
    };
}

type MetadataFeatureProvider = Omit<Provider, "provide" | "multi">;

/**
 * Provide the page metadata configuration
 * @param config
 * @param features
 * @returns
 */
export function providePageMetadata(config: ContentMetadataConfig | (() => ContentMetadataConfig), ...features: (Provider | EnvironmentProviders)[]) {
    const configFn = typeof config === "function" ? config : () => config;

    return makeEnvironmentProviders([
        {
            provide: PAGE_METADATA_CONFIG,
            useFactory: () => configFn(),
        },
        { provide: PAGE_METADATA_STRATEGIES, multi: true, useClass: PageMetadataStrategy },
        { provide: CONTENT, useFactory: (route: ActivatedRoute) => route.snapshot.data["content"], deps: [ActivatedRoute] },

        ...features,
        provideAppInitializer(() => {
            const initializerFn = ((metaService: MetadataService) => initializeMetData(metaService))(inject(MetadataService));
            return initializerFn();
        }),
    ]);
}

/**
 * Enable a metadata strategy for the page
 */
export function withMetadataStrategy(feature: MetadataFeatureProvider): Provider {
    return {
        ...feature,
        provide: PAGE_METADATA_STRATEGIES,
        multi: true,
    } as unknown as Provider;
}

/**
 * Provide the Twitter Card configuration
 * @param config
 * @returns
 */
export function withTwitterCard(config: Partial<TwitterCardConfig> | (() => Partial<TwitterCardConfig>)) {
    const configFn = typeof config === "function" ? config : () => config;
    return makeEnvironmentProviders([
        { provide: TWITTER_CARD_CONFIG, useFactory: configFn },
        { provide: PAGE_METADATA_STRATEGIES, multi: true, useClass: TwitterCardMetadataStrategy },
    ]);
}

/**
 * Provide the Open Graph configuration
 * @param config
 * @returns
 */
export function withOpenGraph(config: OpenGraphConfig | (() => OpenGraphConfig)) {
    const configFn = typeof config === "function" ? config : () => config;
    return makeEnvironmentProviders([
        {
            provide: OPEN_GRAPH_CONFIG,
            useFactory: configFn,
        },
        { provide: PAGE_METADATA_STRATEGIES, multi: true, useClass: OpenGraphMetadataStrategy },
    ]);
}

export function withSchemaOrg(config: SchemaOrgConfig | (() => SchemaOrgConfig)) {
    const configFn = typeof config === "function" ? config : () => config;
    return makeEnvironmentProviders([
        {
            provide: SCHEMA_ORG_METADATA_CONFIG,
            useFactory: configFn,
        },
        { provide: PAGE_METADATA_STRATEGIES, multi: true, useClass: SchemaOrgMetadataStrategy },
    ]);
}
