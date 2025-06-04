import { LinkTag } from "./link";

export interface TwitterCardMetadata {
    "twitter:title": string;
    "twitter:description": string;
    "twitter:creator": string;
    "twitter:image": string;
    "twitter:image:alt": string;
    "twitter:site": string;
    "twitter:card": string;
    "twitter:app:name:iphone": string;
    "twitter:app:id:iphone": string;
    "twitter:app:url:iphone": string;
    "twitter:app:name:ipad": string;
    "twitter:app:id:ipad": string;
    "twitter:app:url:ipad": string;
    "twitter:app:name:googleplay": string;
    "twitter:app:id:googleplay": string;
    "twitter:app:url:googleplay": string;
    "twitter:player": string;
    "twitter:player:width": string;
    "twitter:player:height": string;
    "twitter:player:stream": string;
    "twitter:player:stream:content_type": string;
    "twitter:player:stream:secure_url": string;
    "twitter:player:stream:preview_image": string;
    "twitter:player:stream:preview_image:width": string;
    "twitter:player:stream:preview_image:height": string;
}

export interface OpenGraphMetadata {
    "og:title": string;
    "og:description": string;
    "og:image": string;
    "og:url": string;
    "og:site_name": string;
    "og:locale": string;
    "og:type": string;
    "article:published_time"?: Date;
    "article:author": string;
    "article:tag": string;
    "book:author": string;
    "book:isbn": string;
    "book:release_date"?: Date;
    "profile:first_name": string;
    "profile:last_name": string;
    "profile:username": string;
    "music:duration": string;
    "music:album": string;
    "music:song": string;
    "video:actor": string;
    "video:writer": string;
    "video:duration": string;
    "video:release_date"?: Date;
    "video:series": string;
    "video:director": string;
    "product:price:amount": string;
    "product:price:currency": string;
    "place:location:latitude": string;
    "place:location:longitude": string;
    "event:start_time"?: Date;
    "event:end_time"?: Date;
    "event:location": string;
}

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

export interface SchemaOrgMetadata {
    imageObject: ImageObjectSchema;
    webPage: WebPage;
    localBusiness: LocalBusiness;
    product: Product;
    event: Event;
    service: any;
}

export interface PageMetadata {
    title?: string;
    description?: string;
    keywords?: string;
    author?: string;
    canonicalUrl?: string;
    canonicalBaseUrl?: string;
    image?: string;
    twitter?: Partial<TwitterCardMetadata>;
    og?: Partial<OpenGraphMetadata>;
    schema?: Partial<SchemaOrgMetadata>;
    externalLinks?: LinkTag[];
}
