import { DOCUMENT } from "@angular/common";
import {
    inject,
    Injectable,
    InjectionToken,
} from "@angular/core";
import { ActivatedRouteSnapshot, ActivationEnd, Router } from "@angular/router";
import { PageMetadata } from "./metadata";
import { ContentMetadataConfig, PAGE_METADATA_CONFIG } from "./strategies/page-metadata.strategy";


export function updateHeaderTag(
    dom: Document,
    name: string,
    content: string | undefined,
    tagType: "title" | "meta" | "link" = "meta",
    key: "rel" | "property" | "name" = "name",
): void {
    if (tagType === "title") {
        dom.title = content ?? "";
        return;
    }
    dom.querySelector(`${tagType}[${key}="${name}"]`)?.remove();
    if (!content) return;
    const metaTag = dom.createElement(tagType);
    metaTag.setAttribute(key, name);
    if (tagType === "meta") {
        metaTag.setAttribute("content", content);
    } else if (tagType === "link") {
        metaTag.setAttribute("href", content);
    } else throw new Error(`Invalid tag type ${tagType}`);

    dom.head.appendChild(metaTag);
}

export interface MetadataUpdateStrategy<C extends ContentMetadataConfig = ContentMetadataConfig> {
    config: Partial<C>;
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
    private readonly config = inject(PAGE_METADATA_CONFIG);

    listenForRouteChanges() {
        this.router.events.subscribe((event) => {
            if (event instanceof ActivationEnd) {
                const meta = this.extractMetadataForRoute(event.snapshot) ?? {};

                //TITLE
                if (!meta.title && event.snapshot.title) meta.title = event.snapshot.title;

                //URL
                const baseUrl = this.config.canonicalBaseUrl ?? this.dom.location.origin;
                const path = meta.canonicalPath ?? this.dom.location.pathname + this.dom.location.search;
                meta.url = baseUrl + path;

                this.updateMeta(meta, event.snapshot);
            }
        });
    }

    extractMetadataForRoute(route: ActivatedRouteSnapshot) {
        const content = route.data["content"];
        const metaDataExtractor = route.data["meta"] ?? ((content: any) => content);
        const meta = metaDataExtractor(content);
        return meta;
    }

    updateMeta(meta: PageMetadata, route: ActivatedRouteSnapshot) {
        for (const strategy of this.metadataUpdateStrategies) {
            strategy.update(meta, this.config);
        }
    }

    defineMetadataUpdateStrategy(strategy: MetadataUpdateStrategy) {
        this.metadataUpdateStrategies.push(strategy);
    }
}
