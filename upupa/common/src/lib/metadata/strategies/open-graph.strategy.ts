import { DOCUMENT } from "@angular/common";
import { Injectable, InjectionToken, inject } from "@angular/core";
import { MetadataUpdateStrategy, appendTagToHead } from "../metadata.service";
import { MetaContentBaseModel, PageMetadata } from "../metadata";
import { ContentMetadataConfig } from "./page-metadata.strategy";

export const OPEN_GRAPH_CONFIG = new InjectionToken<OpenGraphConfig>("OPEN_GRAPH_CONFIG");

export type OpenGraphConfig = Pick<ContentMetadataConfig<OpenGraphData>, "imageLoading">;
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
export class OpenGraphMetadataStrategy implements MetadataUpdateStrategy<any> {
    readonly config = inject(OPEN_GRAPH_CONFIG);
    private readonly dom = inject(DOCUMENT);

    private metaUpdateFn = (name: string, content: string | undefined) => appendTagToHead(this.dom, name, content, "meta", "property");

    async update(meta: any, metaFallback: Partial<ContentMetadataConfig>) {
        const fallback = metaFallback.fallback as any;

        const og = { ...(fallback.og ?? {}), ...(meta.og ?? {}) }; //as OpenGraphData;

        const image = this.config?.imageLoading ? this.config.imageLoading({ src: og["og:image"] }) : og["og:image"];
        this.metaUpdateFn("og:image", image);
        delete og["og:image"];

        for (const key in og) {
            const k = key; //as keyof OpenGraphData;
            this.metaUpdateFn(key, og[k] as string);
        }
    }
}
