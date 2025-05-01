import { inject, Injectable, InjectionToken } from "@angular/core";

import { ContentMetadataConfig } from "./page-metadata.strategy";
import { MetadataUpdateStrategy } from "../metadata.service";
import { DOCUMENT } from "@angular/common";
import { TwitterCardMetadata } from "../models";
import { createTag, MetaTag } from "../link";

export const TWITTER_CARD_CONFIG = new InjectionToken<TwitterCardConfig>("TWITTER_CARD_CONFIG");

export type TwitterCardConfig = Pick<ContentMetadataConfig<TwitterCardMetadata>, "imageLoading">;

@Injectable()
export class TwitterCardMetadataStrategy implements MetadataUpdateStrategy<any> {
    readonly config = inject(TWITTER_CARD_CONFIG);

    private readonly dom = inject(DOCUMENT);

    private metaUpdateFn = (name: string, content: string | undefined) => {
        // appendTagToHead(this.dom, name, content, "meta", "name");
        createTag(this.dom, new MetaTag(name, content));
    };

    async update(meta: any, metaFallback: Partial<ContentMetadataConfig>) {
        const pageMetadata = metaFallback.fallback ?? {};
        const fallback = {
            "twitter:title": meta?.title ?? pageMetadata.title,
            "twitter:description": meta?.description ?? pageMetadata.description,
            "twitter:url": meta?.canonicalUrl ?? pageMetadata.canonicalUrl,
            "twitter:image": meta?.image ?? pageMetadata.image,
            "twitter:card": meta?.card ?? pageMetadata?.twitter?.["twitter:card"] ?? "summary_large_image",
        };

        const twitter = { ...fallback, ...pageMetadata.twitter, ...meta?.twitter };

        const image_path = twitter["twitter:image"] ?? metaFallback.fallback?.image ?? "";
        const image = this.config?.imageLoading ? this.config.imageLoading(image_path) : image_path;
        this.metaUpdateFn("twitter:image", image);
        delete twitter["twitter:image"];

        for (const key in twitter) {
            const k = key; //as keyof TwitterCardFormViewModel;
            const content = (twitter[k] ?? "").trim();
            if (!content.length) continue;
            this.metaUpdateFn(key, content);
        }
    }
}
