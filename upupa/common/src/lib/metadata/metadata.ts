import { Provider, EnvironmentProviders, makeEnvironmentProviders, InjectionToken, APP_INITIALIZER } from "@angular/core";
import { MetadataService, PAGE_METADATA_STRATEGIES } from "./metadata.service";
import { DEFAULT_OPEN_GRAPH_CONFIG, OPEN_GRAPH_CONFIG, OpenGraphConfig, OpenGraphMetadataStrategy } from "./strategies/open-graph.strategy";
import { ContentMetadataConfig, PAGE_METADATA_CONFIG, PageMetadataStrategy } from "./strategies/page-metadata.strategy";
import { DEFAULT_TWITTER_CARD_CONFIG, TWITTER_CARD_CONFIG, TwitterCardConfig, TwitterCardMetadataStrategy } from "./strategies/twitter.strategy";
import { ActivatedRoute } from "@angular/router";
import { DEFAULT_SCHEMA_ORG_CONFIG, SCHEMA_ORG_METADATA_CONFIG, SchemaOrgConfig, SchemaOrgMetadataStrategy } from "./strategies/schema-org.strategy";

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
    const configProvider = typeof config == "function" ? { useFactory: config } : { useValue: config };

    return makeEnvironmentProviders([
        {
            provide: PAGE_METADATA_CONFIG,
            ...configProvider,
        } as Provider,
        { provide: PAGE_METADATA_STRATEGIES, multi: true, useClass: PageMetadataStrategy },
        { provide: CONTENT, useFactory: (route: ActivatedRoute) => route.snapshot.data["content"], deps: [ActivatedRoute] },

        ...features,
        {
            provide: APP_INITIALIZER,
            useFactory: (metaService: MetadataService) => initializeMetData(metaService),
            deps: [MetadataService],
            multi: true,
        },
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
export function withTwitterCard(config: Partial<TwitterCardConfig> = DEFAULT_TWITTER_CARD_CONFIG) {
    return makeEnvironmentProviders([
        { provide: TWITTER_CARD_CONFIG, useValue: { ...DEFAULT_TWITTER_CARD_CONFIG, ...config } },
        { provide: PAGE_METADATA_STRATEGIES, multi: true, useClass: TwitterCardMetadataStrategy },
    ]);
}

/**
 * Provide the Open Graph configuration
 * @param config
 * @returns
 */
export function withOpenGraph(config: Partial<OpenGraphConfig> = DEFAULT_OPEN_GRAPH_CONFIG) {
    return makeEnvironmentProviders([
        {
            provide: OPEN_GRAPH_CONFIG,
            useValue: { ...DEFAULT_OPEN_GRAPH_CONFIG, ...config },
        },
        { provide: PAGE_METADATA_STRATEGIES, multi: true, useClass: OpenGraphMetadataStrategy },
    ]);
}

export function withSchemaOrg(config: Partial<SchemaOrgConfig> = DEFAULT_SCHEMA_ORG_CONFIG) {
    return makeEnvironmentProviders([
        {
            provide: SCHEMA_ORG_METADATA_CONFIG,
            useValue: { ...DEFAULT_SCHEMA_ORG_CONFIG, ...config },
        },
        { provide: PAGE_METADATA_STRATEGIES, multi: true, useClass: SchemaOrgMetadataStrategy },
    ]);
}
