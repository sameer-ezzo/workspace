
import { inject, DOCUMENT } from "@angular/core";
import { MetadataUpdateStrategy } from "../metadata.service";
import { ContentMetadataConfig, renderMetaTags } from "./page-metadata.strategy";
import { OpenGraphMetadata } from "../models";

export type OpenGraphConfig = Pick<ContentMetadataConfig<OpenGraphMetadata>, "imageLoading">;

// @Injectable()
export class OpenGraphMetadataStrategy extends MetadataUpdateStrategy<OpenGraphConfig> {
    private readonly dom = inject(DOCUMENT);

    constructor(config: OpenGraphConfig) {
        super(config);
    }

    override async update(meta: any, metaFallback: Partial<ContentMetadataConfig>) {
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
        og["og:image"] = image;

        renderMetaTags(this.dom, og, "property");
    }
}
