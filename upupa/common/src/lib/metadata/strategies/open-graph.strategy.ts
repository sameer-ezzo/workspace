import { DOCUMENT } from "@angular/common";
import { Injectable, InjectionToken, inject } from "@angular/core";
import { appendTagToHead, MetadataUpdateStrategy } from "../metadata.service";
import { ContentMetadataConfig } from "./page-metadata.strategy";
import { OpenGraphMetadata } from "../models";

export const OPEN_GRAPH_CONFIG = new InjectionToken<OpenGraphConfig>("OPEN_GRAPH_CONFIG");

export type OpenGraphConfig = Pick<ContentMetadataConfig<OpenGraphMetadata>, "imageLoading">;
export const DEFAULT_OPEN_GRAPH_CONFIG: OpenGraphConfig = {
    imageLoading: (config: { src?: string; size?: string }) => {
        const src = config.src ?? "";
        if (!src) return "";
        const size = config.size ?? "1200x630";
        return `${src}?size=${size}`;
    },
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
