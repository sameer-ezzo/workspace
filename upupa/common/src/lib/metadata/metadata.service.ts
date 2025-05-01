import { DOCUMENT } from "@angular/common";
import { inject, Injectable, InjectionToken } from "@angular/core";
import { ActivatedRouteSnapshot, ActivationEnd, Router } from "@angular/router";

import { ContentMetadataConfig, PAGE_METADATA_CONFIG } from "./strategies/page-metadata.strategy";
import { PageMetadata } from "./models";

export interface MetadataUpdateStrategy<C extends ContentMetadataConfig = ContentMetadataConfig> {
    // config: Partial<C>;
    update(meta: PageMetadata, metaFallback: Partial<ContentMetadataConfig>): Promise<void>;
}

export const PAGE_METADATA_STRATEGIES = new InjectionToken<MetadataUpdateStrategy[]>("PAGE_METADATA_STRATEGIES");

/**
 * Service that listens for route changes and updates the page metadata accordingly. You don't need to use this service directly, it's used automatically when you use the `providePageMetadata` function.
 */
@Injectable({ providedIn: "root" })
export class MetadataService {
    private readonly metadataUpdateStrategies = inject(PAGE_METADATA_STRATEGIES);

    private readonly router = inject(Router);
    private readonly dom = inject(DOCUMENT);
    readonly config = inject(PAGE_METADATA_CONFIG);

    // this function helps to update the config object
    // in new versions of Angular, this could not be set during the app initialization.
    updateConfig(config: Partial<ContentMetadataConfig>) {
        Object.assign(this.config, config);
    }
    async listenForRouteChanges() {
        this.router.events.subscribe((event) => {
            if (event instanceof ActivationEnd) {
                //accumulate metadata from child route up to the root route
                const navigation = this.router.getCurrentNavigation();

                const meta = { ...this.extractMetadataForRoute(event.snapshot), ...navigation.extras["meta"] };
                navigation.extras["meta"] = meta;

                //Only update metadata for the root route
                if (event.snapshot.root !== event.snapshot.parent) return;

                //TITLE
                if (!meta.title && event.snapshot.title) meta.title = event.snapshot.title;

                //URL
                const baseUrl = this.config.canonicalBaseUrl ?? this.dom.location.origin;
                const path = meta.canonicalPath ?? this.dom.location.pathname + this.dom.location.search;
                meta.url = baseUrl + path;
                this.updateMeta(meta, this.config, event.snapshot);
            }
        });
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
