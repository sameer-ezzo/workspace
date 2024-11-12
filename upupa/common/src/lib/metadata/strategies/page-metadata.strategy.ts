import { inject, Injectable, InjectionToken } from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { MetadataUpdateStrategy, updateHeaderTag } from "../metadata.service";
import { PageMetadata } from "../metadata";


export const CONTENT_METADATA_CONFIG = new InjectionToken<ContentMetadataConfig>("CONTENT_METADATA_CONFIG");
export const PAGE_METADATA_CONFIG = new InjectionToken<ContentMetadataConfig>("PAGE_METADATA_CONFIG");

export const DEFAULT_CONTENT_METADATA_CONFIG: ContentMetadataConfig = {
    imageLoading: (config: { src?: string; size?: string }) => {
        const src = config.src ?? "";
        if (!src) return "";
        const size = config.size ?? "";
        return `${src}?size=${size}`;
    },
};



export type ContentMetadataConfig<M = PageMetadata> = {
    canonicalBaseUrl?: string;
    fallback?: Partial<M> | (() => Partial<M>);
    imageLoading?: (config: { src?: string; size?: string }) => string;
};


@Injectable()
export class PageMetadataStrategy implements MetadataUpdateStrategy<ContentMetadataConfig> {
    readonly config = DEFAULT_CONTENT_METADATA_CONFIG;
    private readonly dom = inject(DOCUMENT);

    async update(meta: PageMetadata, metaFallback: Partial<ContentMetadataConfig>) {
        const _fallback = this.config.fallback ?? metaFallback.fallback;
        const fallbackFunc = typeof _fallback === "function" ? _fallback : () => _fallback;
        const fallback = fallbackFunc() ?? {};

        meta = { ...fallback, ...(meta ?? {}) } as PageMetadata;
        const dom = this.dom;
        updateHeaderTag(dom, "title", meta.title, "title");
        updateHeaderTag(dom, "description", meta.description);
        updateHeaderTag(dom, "keywords", meta.keywords);
        updateHeaderTag(dom, "canonical", meta.url, "link", "rel");
        updateHeaderTag(dom, "robots", meta.robots);
        updateHeaderTag(dom, "theme-color", meta.themeColor);
        updateHeaderTag(dom, "charset", meta.charset);
        updateHeaderTag(dom, "refresh", meta.refresh);
        updateHeaderTag(dom, "content-language", meta.contentLanguage);

        const image = this.config?.imageLoading ? this.config.imageLoading({ src: meta.image }) : meta.image;
        updateHeaderTag(dom, "image", image);
    }
}


