import { DOCUMENT } from "@angular/common";
import { Injectable, InjectionToken, inject } from "@angular/core";
import { MetadataUpdateStrategy, updateHeaderTag } from "../metadata.service";
import { MetaContentBaseModel, PageMetadata } from "../metadata";
import { ContentMetadataConfig } from "./page-metadata.strategy";

export const OPEN_GRAPH_CONFIG = new InjectionToken<OpenGraphConfig>("OPEN_GRAPH_CONFIG");

export type OpenGraphConfig = ContentMetadataConfig<OpenGraphData>;
export const DEFAULT_OPEN_GRAPH_CONFIG: OpenGraphConfig = {
    imageLoading: (config: { src?: string; size?: string }) => {
        const src = config.src ?? "";
        if (!src) return "";
        const size = config.size ?? "1200x630";
        return `${src}?size=${size}`;
    },
};


export type OpenGraphData = MetaContentBaseModel & {
    type?: "website" | "article" | "video" | "music" | "book" | "profile"; // Example Open Graph types
    imageWidth?: string;
    imageHeight?: string;
    siteName?: string;
    locale?: string; // Example: 'en_US', 'es_ES'
    video?: string;
    audio?: string;
    updatedTime?: string; // ISO 8601 format
    articleTags?: string;
    articlePublishedTime?: string; // ISO 8601 format
    articleModifiedTime?: string; // ISO 8601 format
};




@Injectable()
export class OpenGraphMetadataStrategy implements MetadataUpdateStrategy<OpenGraphConfig> {
    readonly config = inject(OPEN_GRAPH_CONFIG);
    private readonly dom = inject(DOCUMENT);

    async update(meta: PageMetadata, metaFallback: Partial<ContentMetadataConfig>) {
        const _fallback = this.config.fallback ?? metaFallback.fallback;
        const fallbackFunc = typeof _fallback === "function" ? _fallback : () => _fallback;
        const fallback = fallbackFunc() ?? {};

        const og = { ...fallback, ...meta, ...(meta.openGraph ?? {}) } as OpenGraphData;
        const dom = this.dom;
        updateHeaderTag(dom, "og:title", og.title);
        updateHeaderTag(dom, "og:description", og.description);
        updateHeaderTag(dom, "og:url", og.url);
        updateHeaderTag(dom, "og:type", og.type);
        updateHeaderTag(dom, "og:author", og.author);
        updateHeaderTag(dom, "og:image:width", og.imageWidth);
        updateHeaderTag(dom, "og:image:height", og.imageHeight);
        updateHeaderTag(dom, "og:site_name", og.siteName);
        updateHeaderTag(dom, "og:locale", og.locale);
        updateHeaderTag(dom, "og:video", og.video);
        updateHeaderTag(dom, "og:audio", og.audio);
        updateHeaderTag(dom, "og:updated_time", og.updatedTime);
        updateHeaderTag(dom, "article:tag", og.articleTags);
        updateHeaderTag(dom, "article:published_time", og.articlePublishedTime);
        updateHeaderTag(dom, "article:modified_time", og.articleModifiedTime);

        const image = this.config?.imageLoading ? this.config.imageLoading({ src: og.image }) : og.image;
        updateHeaderTag(dom, "og:image", image);
    }
}
