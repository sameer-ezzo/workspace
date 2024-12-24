import { DOCUMENT } from "@angular/common";
import { inject, Injectable, InjectionToken } from "@angular/core";
import { MetadataUpdateStrategy } from "../metadata.service";
import { ContentMetadataConfig } from "./page-metadata.strategy";
import { ImageObjectSchema, SchemaOrgMetadata } from "../models";

export type SchemaOrgConfig = Pick<ContentMetadataConfig<SchemaOrgMetadata>, "imageLoading">;
export const DEFAULT_SCHEMA_ORG_CONFIG: SchemaOrgConfig = {
    imageLoading: (config: { src?: string; size?: string }) => {
        const src = config.src ?? "";
        if (!src) return "";
        const size = config.size ?? "1200x630";
        return `${src}?size=${size}`;
    },
};
export const SCHEMA_ORG_METADATA_CONFIG = new InjectionToken<ContentMetadataConfig>("CONTENT_METADATA_CONFIG");

@Injectable()
export class SchemaOrgMetadataStrategy implements MetadataUpdateStrategy<any> {
    private readonly dom = inject(DOCUMENT);

    async update(meta: any, metaFallback: Partial<ContentMetadataConfig>) {
        this.clearSchemaOrgTags();
        const fallback = metaFallback.fallback as any;
        const schema = { ...(fallback.schema ?? {}), ...(meta.schema ?? {}) };
        for (const schemaKey in schema) {
            if (Object.prototype.hasOwnProperty.call(schema, schemaKey)) {
                this.makeSchemaOrgTag(schemaKey, schema[schemaKey]);
            }
        }
    }

    // clear all application/ld+json schema tags from the head
    private clearSchemaOrgTags() {
        const scripts = Array.from(this.dom.head.querySelectorAll("script") as NodeListOf<HTMLScriptElement>);
        scripts.forEach((s) => {
            if (s.type === "application/ld+json") {
                s.remove();
            }
        });
    }

    makeSchemaOrgTag(type: string, schema: ImageObjectSchema) {
        const s = this.fillSchemaByType(type, schema);
        if (!s) return;
        const script = this.dom.createElement("script");
        script.type = "application/ld+json";
        script.text = JSON.stringify(s, null, 4);
        this.dom.head.appendChild(script);
    }

    fillSchemaByType(type: string, schema: ImageObjectSchema): any {
        switch (type) {
            case "imageObject":
                return this.fillImageObject(schema);
            case "webPage":
                return this.fillWebPage(schema);
            case "localBusiness":
                return this.fillLocalBusiness(schema);
            case "product":
                return this.fillProduct(schema);
            case "event":
                return this.fillEvent(schema);
            case "blogPosting":
                return this.fillBlogPosting(schema);
            default:
                return undefined;
        }
    }
    fillBlogPosting(schema: ImageObjectSchema): any {
        return {
            ...schema,
            "@context": "https://schema.org",
            "@type": "BlogPosting",
        };
    }
    fillEvent(schema: ImageObjectSchema): any {
        return {
            ...schema,
            "@context": "https://schema.org",
            "@type": "Event",
        };
    }
    fillProduct(schema: ImageObjectSchema): any {
        return {
            ...schema,
            "@context": "https://schema.org",
            "@type": "Product",
        };
    }
    fillLocalBusiness(schema: ImageObjectSchema): any {
        return {
            ...schema,
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
        };
    }
    fillWebPage(schema: ImageObjectSchema): any {
        return {
            ...schema,
            "@context": "https://schema.org",
            "@type": "WebPage",
        };
    }
    fillImageObject(schema: ImageObjectSchema): any {
        return {
            ...schema,
            "@context": "https://schema.org",
            "@type": "ImageObject",
        };
    }
}
