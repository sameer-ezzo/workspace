import { DOCUMENT } from "@angular/common";
import { Injectable, InjectionToken, inject } from "@angular/core";
import { MetadataUpdateStrategy, updateHeaderTag } from "../metadata.service";
import { MetaContentBaseModel, PageMetadata } from "../metadata";
import { ContentMetadataConfig } from "./page-metadata.strategy";


export const TWITTER_CARD_CONFIG = new InjectionToken<TwitterCardConfig>("TWITTER_CARD_CONFIG");

export type TwitterCardConfig = ContentMetadataConfig<TwitterCard>;

export const DEFAULT_TWITTER_CARD_CONFIG: TwitterCardConfig = {
    imageLoading: (config: { src?: string; size?: string }) => {
        const src = config.src ?? "";
        if (!src) return "";
        const size = config.size ?? "1200x675";
        return `${src}?size=${size}`;
    },
};


export type TwitterCard = MetaContentBaseModel & {
    card?: "summary" | "summary_large_image" | "app" | "player"; // Standard Twitter Card types
    imageAlt?: string;
    site?: string;
    creator?: string;
    appName?: {
        iphone?: string;
        ipad?: string;
        googleplay?: string;
    };
    appId?: {
        iphone?: string;
        ipad?: string;
        googleplay?: string;
    };
    appUrl?: {
        iphone?: string;
        ipad?: string;
        googleplay?: string;
    };
};


@Injectable()
export class TwitterMetadataStrategy implements MetadataUpdateStrategy<TwitterCardConfig> {
    readonly config = inject(TWITTER_CARD_CONFIG);
    private readonly dom = inject(DOCUMENT);

    async update(meta: PageMetadata, metaFallback: Partial<ContentMetadataConfig>) {
        const _fallback = this.config.fallback ?? metaFallback.fallback;
        const fallbackFunc = typeof _fallback === "function" ? _fallback : () => _fallback;
        const fallback = fallbackFunc() ?? {};

        const twitter = { ...fallback, ...meta, ...(meta.twitter ?? {}) } as TwitterCard;

        const dom = this.dom;
        updateHeaderTag(dom, "twitter:title", twitter.title);
        updateHeaderTag(dom, "twitter:description", twitter.description);
        updateHeaderTag(dom, "twitter:url", twitter.url);
        updateHeaderTag(dom, "twitter:card", twitter.card);
        updateHeaderTag(dom, "twitter:image:alt", twitter.imageAlt);
        updateHeaderTag(dom, "twitter:site", twitter.site);
        updateHeaderTag(dom, "twitter:creator", twitter.creator);
        updateHeaderTag(dom, "twitter:app:name:iphone", twitter.appName?.iphone);
        updateHeaderTag(dom, "twitter:app:name:ipad", twitter.appName?.ipad);
        updateHeaderTag(dom, "twitter:app:name:googleplay", twitter.appName?.googleplay);
        updateHeaderTag(dom, "twitter:app:id:iphone", twitter.appId?.iphone);
        updateHeaderTag(dom, "twitter:app:id:ipad", twitter.appId?.ipad);
        updateHeaderTag(dom, "twitter:app:id:googleplay", twitter.appId?.googleplay);
        updateHeaderTag(dom, "twitter:app:url:iphone", twitter.appUrl?.iphone);
        updateHeaderTag(dom, "twitter:app:url:ipad", twitter.appUrl?.ipad);
        updateHeaderTag(dom, "twitter:app:url:googleplay", twitter.appUrl?.googleplay);

        const image = this.config?.imageLoading ? this.config.imageLoading({ src: twitter.image }) : twitter.image;
        updateHeaderTag(dom, "twitter:image", image);
    }
}
