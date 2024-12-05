import { DOCUMENT } from "@angular/common";
import { inject, Injectable } from "@angular/core";
import { MetadataUpdateStrategy } from "../metadata.service";
import { ContentMetadataConfig } from "./page-metadata.strategy";

interface Blog {
    "@context": "https://schema.org";
    "@type": "Blog";
    name: string;
    description?: string;
    url: string;
    author?: Person;
    dateCreated?: string;
}

interface BlogPosting {
    "@context": "https://schema.org";
    "@type": "BlogPosting";
    headline: string; // Title of the blog post
    alternativeHeadline?: string; // A short title for the blog post
    image?: string | string[]; // URL(s) of images associated with the blog post
    author: Person;
    publisher?: Organization;
    datePublished: string; // ISO 8601 format
    dateModified?: string; // ISO 8601 format
    mainEntityOfPage?: string; // URL of the blog post
    description?: string; // A short description of the blog post
    articleBody?: string; // The main content/body of the blog post
    url: string; // URL to the individual blog post
}

interface WebPage {
    "@context": "https://schema.org";
    "@type": "WebPage";
    name: string;
    description: string;
    url: string;
    breadcrumb?: BreadcrumbList;
}

interface BreadcrumbList {
    "@type": "BreadcrumbList";
    itemListElement: ListItem[];
}

interface ListItem {
    "@type": "ListItem";
    position: number;
    name: string;
    item: string;
}

interface LocalBusiness {
    "@context": "https://schema.org";
    "@type": "LocalBusiness";
    name: string;
    description?: string;
    image?: string;
    address: PostalAddress;
    telephone?: string;
    openingHours?: string[];
    geo?: GeoCoordinates;
}

interface PostalAddress {
    "@type": "PostalAddress";
    streetAddress: string;
    addressLocality: string;
    addressRegion?: string;
    postalCode: string;
    addressCountry: string;
}

interface GeoCoordinates {
    "@type": "GeoCoordinates";
    latitude: number;
    longitude: number;
}

interface Product {
    "@context": "https://schema.org";
    "@type": "Product";
    name: string;
    description: string;
    image: string;
    sku?: string;
    brand?: Brand;
    offers?: Offer[];
}

interface Brand {
    "@type": "Brand";
    name: string;
}

interface Offer {
    "@type": "Offer";
    price: string;
    priceCurrency: string;
    availability?: string; // e.g., "https://schema.org/InStock"
    url?: string;
}

interface Event {
    "@context": "https://schema.org";
    "@type": "Event";
    name: string;
    description: string;
    startDate: string; // ISO 8601 format
    endDate?: string; // ISO 8601 format
    location: Place;
    offers?: Offer[];
}

interface Place {
    "@type": "Place";
    name: string;
    address: PostalAddress;
}

interface ImageObject {
    "@context": "https://schema.org";
    "@type": "ImageObject";
    contentUrl: string;
    name?: string;
    description?: string;
    author?: Person;
    datePublished?: string;
    uploadDate?: string;
    license?: string;
    width?: string;
    height?: string;
    fileFormat?: string;
}

interface Person {
    "@type": "Person";
    name: string;
}

interface VideoObject {
    "@context": "https://schema.org";
    "@type": "VideoObject";
    name: string;
    description: string;
    thumbnailUrl: string[];
    uploadDate: string; // ISO 8601 format
    contentUrl: string;
    embedUrl?: string;
    duration?: string; // ISO 8601 duration format
    author?: Person;
    publisher?: Organization;
    interactionStatistic?: InteractionCounter;
    license?: string;
    requiresSubscription?: boolean;
}

interface Organization {
    "@type": "Organization";
    name: string;
    logo?: ImageObject;
}

interface InteractionCounter {
    "@type": "InteractionCounter";
    interactionType: string; // e.g., "https://schema.org/WatchAction"
    userInteractionCount: number;
}

export interface SchemaAuthorForm {
    "@type": "Person";
    name: string;
}

export interface ImageObjectSchema {
    "@context": string;
    "@type": string;
    contentUrl: string;
    name: string;
    description: string;
    author: SchemaAuthorForm;
    datePublished: Date | undefined;
    uploadDate: Date | undefined;
    license: string;
    width: number;
    height: number;
}

export interface SchemaOrgFormViewModel {
    imageObject: ImageObjectSchema;
    webPage: WebPage;
    localBusiness: LocalBusiness;
    product: Product;
    event: Event;
}
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
        if (schema.imageObject) {
        } else if (schema.imageObjects) {
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
