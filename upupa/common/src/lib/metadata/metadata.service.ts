import { inject, Injectable, DOCUMENT } from "@angular/core";
import { ActivatedRouteSnapshot, ActivationEnd, Router } from "@angular/router";

import { ContentMetadataConfig } from "./strategies/page-metadata.strategy";
import { PageMetadata } from "./models";

export abstract class MetadataUpdateStrategy<C extends ContentMetadataConfig = ContentMetadataConfig> {
    constructor(protected readonly config: C) {}
    abstract update(meta: PageMetadata, metaFallback: Partial<ContentMetadataConfig>): Promise<void>;
}

/**
 * Service that listens for route changes and updates the page metadata accordingly. You don't need to use this service directly, it's used automatically when you use the `providePageMetadata` function.
 */
@Injectable({ providedIn: "root" })
export class MetadataService {
    private readonly metadataUpdateStrategies = [];

    private readonly router = inject<Router>(Router);
    private readonly dom = inject<Document>(DOCUMENT);
    private _config: ContentMetadataConfig<PageMetadata> = undefined;

    initialize(config: ContentMetadataConfig<PageMetadata>) {
        this._config = config;
        this.router.events.subscribe((event) => {
            if (event instanceof ActivationEnd) {
                //accumulate metadata from child route up to the root route
                const navigation = this.router.currentNavigation();

                const meta = { ...this.extractMetadataForRoute(event.snapshot), ...navigation.extras["meta"] };
                navigation.extras["meta"] = meta;

                //Only update metadata for the root route
                if (event.snapshot.root !== event.snapshot.parent) return;

                //TITLE
                if (!meta.title && event.snapshot.title) meta.title = event.snapshot.title;

                //URL
                const baseUrl = this._config.canonicalBaseUrl ?? this.dom.location.origin;
                const path = meta.canonicalPath ?? this.dom.location.pathname + this.dom.location.search;
                meta.url = baseUrl + path;
                this.updateMeta(meta, this._config, event.snapshot);
            }
        });
    }

    // this function helps to update the config object
    // in new versions of Angular, this could not be set during the app initialization.
    updateConfig(config: Partial<ContentMetadataConfig>) {
        Object.assign(this._config ?? {}, config);
    }

    extractMetadataForRoute(route: ActivatedRouteSnapshot) {
        const content = route.data["content"];
        const metaDataExtractor = route.data["meta"] ?? ((content: any) => content);
        const meta = typeof metaDataExtractor === "function" ? metaDataExtractor(content) : metaDataExtractor;
        return meta;
    }

    async updateMeta(meta: PageMetadata, config: ContentMetadataConfig<PageMetadata>, route: ActivatedRouteSnapshot) {
        const dom = this.dom;
        dom.head.appendChild(dom.createTextNode("\n"));
        for (const strategy of this.metadataUpdateStrategies) {
            await strategy.update(meta, config);
        }
        dom.head.appendChild(dom.createTextNode("\n"));
    }

    defineMetadataUpdateStrategy(strategy: MetadataUpdateStrategy) {
        this.metadataUpdateStrategies.push(strategy);
    }
}
