import { DOCUMENT } from "@angular/common";
import { Provider, EnvironmentProviders, makeEnvironmentProviders, APP_INITIALIZER, InjectionToken } from "@angular/core";
import { MetadataService, PAGE_METADATA_STRATEGIES } from "./metadata.service";
import {
    DEFAULT_OPEN_GRAPH_CONFIG,
    OPEN_GRAPH_CONFIG,
    OpenGraphConfig,
    OpenGraphData,
    OpenGraphMetadataStrategy,
} from "./strategies/open-graph.strategy";
import {
    ContentMetadataConfig,
    DEFAULT_CONTENT_METADATA_CONFIG,
    PAGE_METADATA_CONFIG,
    PageMetadataStrategy,
} from "./strategies/page-metadata.strategy";
import {
    DEFAULT_TWITTER_CARD_CONFIG,
    TWITTER_CARD_CONFIG,
    TwitterCard,
    TwitterCardConfig,
    TwitterMetadataStrategy,
} from "./strategies/twitter.strategy";
import { ActivatedRoute } from "@angular/router";

export const CONTENT = new InjectionToken("CONTENT");

export type MetaContentBaseModel = {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    canonicalPath?: string;
    type?: string;
    author?: string;
} & Record<string, string | null | undefined>; // to allow for custom meta tags like <meta name="googlebot-news" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">

export type PageMetadata = MetaContentBaseModel & {
    keywords?: string;
    robots?: "index,follow" | "noindex,nofollow" | "index,nofollow" | "noindex,follow" | string;
    themeColor?: string;
    charset?: "UTF-8" | "ISO-8859-1" | string;
    refresh?: string; // Example: '5; url=https://example.com'
    contentLanguage?: string; // Example: 'en', 'es', 'fr'

    openGraph?: OpenGraphData;
    twitter?: TwitterCard;
};

function initializeMetData(doc: Document, metaService: MetadataService) {
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
export function providePageMetadata(config: Partial<ContentMetadataConfig>, ...features: (Provider | EnvironmentProviders)[]) {
    return makeEnvironmentProviders([
        { provide: PAGE_METADATA_CONFIG, useValue: { ...DEFAULT_CONTENT_METADATA_CONFIG, ...config } },
        { provide: PAGE_METADATA_STRATEGIES, multi: true, useClass: PageMetadataStrategy },
        { provide: CONTENT, useFactory: (route: ActivatedRoute) => route.snapshot.data["content"], deps: [ActivatedRoute] },
        ...features,
        {
            provide: APP_INITIALIZER,
            useFactory: (doc: Document, metaService: MetadataService) => initializeMetData(doc, metaService),
            multi: true,
            deps: [DOCUMENT, MetadataService],
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
        { provide: PAGE_METADATA_STRATEGIES, multi: true, useClass: TwitterMetadataStrategy },
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
