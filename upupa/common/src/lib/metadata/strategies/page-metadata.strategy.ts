import { inject, Injectable, InjectionToken, Injector, runInInjectionContext } from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { appendTagToHead, MetadataUpdateStrategy } from "../metadata.service";
import { PageMetadata } from "../models";

export const CONTENT_METADATA_CONFIG = new InjectionToken<ContentMetadataConfig>("CONTENT_METADATA_CONFIG");
export const PAGE_METADATA_CONFIG = new InjectionToken<ContentMetadataConfig>("PAGE_METADATA_CONFIG");

export function resourceLinkNormalize(baseUrl: string, path: string): string {
    if (!path) return baseUrl;
    if (path.startsWith("/")) return `${baseUrl}${path}`;
    if (path.startsWith("http")) return path;
    return `${baseUrl}/${path}`;
}

export type ContentMetadataConfig<M = PageMetadata> = {
    titleTemplate?: (title: string) => string;
    imageLoading: (path: string) => string;
    canonicalBaseUrl?: string;
    fallback?: Partial<M>;
};

@Injectable()
export class PageMetadataStrategy implements MetadataUpdateStrategy<ContentMetadataConfig> {
    readonly config = inject(PAGE_METADATA_CONFIG);
    readonly dom = inject(DOCUMENT);
    readonly injector = inject(Injector);

    async update(meta: any, metaFallback: Partial<ContentMetadataConfig>) {
        const dom = this.dom;
        const fallback = metaFallback.fallback;

        meta = { ...fallback, ...(meta ?? {}) }; //as PageMetadata;

        delete meta.twitter;
        delete meta.og;
        delete meta.schema;

        const title = runInInjectionContext(this.injector, () => meta.titleTemplate?.(meta.title) ?? this.config.titleTemplate?.(meta.title) ?? meta.title);
        appendTagToHead(dom, "title", title, "title");
        appendTagToHead(dom, "canonical", meta["canonical"], "link", "rel");

        const image_path = meta.image ?? fallback?.image ?? "";
        const image = this.config?.imageLoading ? this.config.imageLoading(image_path) : image_path;
        appendTagToHead(dom, "image", image);

        if (meta.externalLinks) {
            for (const link of meta.externalLinks) {
                appendTagToHead(dom, link.rel, link.href, "link", "rel", false);
            }
        }

        delete meta["image"];
        delete meta["title"];
        delete meta["canonical"];
        delete meta["externalLinks"];

        for (const key in meta) {
            const k = key; //as keyof PageMetadata;
            appendTagToHead(dom, key, meta[k] as string);
        }
    }
}
