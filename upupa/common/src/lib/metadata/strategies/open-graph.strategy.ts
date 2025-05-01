import { DOCUMENT } from "@angular/common";
import { Injectable, InjectionToken, inject } from "@angular/core";
import { MetadataUpdateStrategy } from "../metadata.service";
import { ContentMetadataConfig } from "./page-metadata.strategy";
import { OpenGraphMetadata } from "../models";
import { createTag, MetaTag } from "../link";

export const OPEN_GRAPH_CONFIG = new InjectionToken<OpenGraphConfig>("OPEN_GRAPH_CONFIG");
export type OpenGraphConfig = Pick<ContentMetadataConfig<OpenGraphMetadata>, "imageLoading">;

@Injectable()
export class OpenGraphMetadataStrategy implements MetadataUpdateStrategy<any> {
    readonly config = inject(OPEN_GRAPH_CONFIG);
    private readonly dom = inject(DOCUMENT);

    private metaUpdateFn = (name: string, content: string | undefined) => {
        createTag(this.dom, new MetaTag(name, content, "property"));
        // appendTagToHead(this.dom, name, content, "meta", "property");
    };

    async update(meta: any, metaFallback: Partial<ContentMetadataConfig>) {
        const pageMetadata = metaFallback.fallback ?? {};
        const fallback = {
            "og:title": meta?.title ?? pageMetadata.title,
            "og:description": meta?.description ?? pageMetadata.description,
            "og:url": meta?.canonicalUrl ?? pageMetadata.canonicalUrl,
            "og:image": meta?.image ?? pageMetadata.image,
        };

        const og = { ...fallback, ...pageMetadata.og, ...meta?.og }; //as OpenGraphData;

        const image_path = og["og:image"] ?? metaFallback.fallback?.image ?? "";
        const image = this.config?.imageLoading ? this.config.imageLoading(image_path) : image_path;
        this.metaUpdateFn("og:image", image);
        delete og["og:image"];

        for (const key in og) {
            const k = key; //as keyof OpenGraphData;
            const content = (og[k] ?? "").trim();
            if (!content.length) continue;
            this.metaUpdateFn(key, content);
        }
    }
}
