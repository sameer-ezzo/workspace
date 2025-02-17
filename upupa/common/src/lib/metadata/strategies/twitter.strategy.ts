import { inject, Injectable, InjectionToken } from "@angular/core";

import { ContentMetadataConfig } from "./page-metadata.strategy";
import { MetadataUpdateStrategy, appendTagToHead } from "../metadata.service";
import { DOCUMENT } from "@angular/common";
import { TwitterCardMetadata } from "../models";

export const TWITTER_CARD_CONFIG = new InjectionToken<TwitterCardConfig>("TWITTER_CARD_CONFIG");

export type TwitterCardConfig = Pick<ContentMetadataConfig<TwitterCardMetadata>, "imageLoading">;

export const DEFAULT_TWITTER_CARD_CONFIG: TwitterCardConfig = {
    imageLoading: (config: { src?: string; size?: string }) => {
        const src = config.src ?? "";
        if (!src) return "";
        const size = config.size ?? "1200x675";
        return `${src}?size=${size}`;
    },
};

@Injectable()
export class TwitterCardMetadataStrategy implements MetadataUpdateStrategy<any> {
    readonly config = inject(TWITTER_CARD_CONFIG);

    private readonly dom = inject(DOCUMENT);

    private metaUpdateFn = (name: string, content: string | undefined) => appendTagToHead(this.dom, name, content, "meta", "name");

    async update(meta: any, metaFallback: Partial<ContentMetadataConfig>) {
        const fallback = (metaFallback.fallback ?? {}) as any;

        const twitter = { ...(fallback.twitter ?? {}), ...(meta.twitter ?? {}) }; // as TwitterCardFormViewModel;

        const image = this.config?.imageLoading ? this.config.imageLoading({ src: twitter["twitter:image"] }) : twitter["twitter:image"];
        this.metaUpdateFn("twitter:image", image);
        delete twitter["twitter:image"];

        for (const key in twitter) {
            const k = key; //as keyof TwitterCardFormViewModel;
            this.metaUpdateFn(key, twitter[k] as string);
        }
    }
}
