import { inject, InjectionToken, Injector, runInInjectionContext, DOCUMENT } from "@angular/core";

import { MetadataUpdateStrategy } from "../metadata.service";
import { PageMetadata } from "../models";
import { createTag, LinkTag, MetaTag, TitleMetaTag } from "../link";

export const CONTENT_METADATA_CONFIG = new InjectionToken<ContentMetadataConfig>("CONTENT_METADATA_CONFIG");
const stripLeadingSlashes = (path: string) => {
    path ??= "";
    return path.startsWith("/") ? path.slice(1) : path;
};
const stripTrailingSlashes = (path: string) => {
    path ??= "";
    return path.endsWith("/") ? path.slice(0, -1) : path;
};

export function resourceLinkNormalize(baseUrl: string, path: string) {
    path = stripLeadingSlashes((path || "").trim());
    baseUrl = stripTrailingSlashes((baseUrl || "").trim());
    let src = "";
    if (!path.length) src = baseUrl;
    else if (path.startsWith("http")) src = path;
    else src = baseUrl + "/" + path;
    return src;
}

export type MetaImageLinkOptions = {
    view?: { w?: string; h?: string; attachment?: "inline" | "attachment" };
} & Record<string, string | { w?: string; h?: string; attachment?: "inline" | "attachment" }>;

export function metaImageLinkNormalize(
    baseUrl: string,
    baseHref: string,
    path: string,
    options: Partial<MetaImageLinkOptions> = {
        view: { attachment: "inline" },
    },
): string {
    const w = options?.view?.w;
    const h = options?.view?.h;
    const attachment = options?.view?.attachment;
    delete options.view;

    baseUrl = stripTrailingSlashes(baseUrl);
    baseHref = baseHref || "/";
    path = stripLeadingSlashes((path || "").trim());

    if (path.startsWith("http")) return path;
    else if (path.startsWith("storage/")) {
        const [base, qps] = (baseUrl + "/" + path).split("?");
        const queryParams = (qps || "").split("&").map((q) => q.split("="));

        const imageResizeOptions = new Map<string, string>(Object.entries(options as Record<string, string>));
        if (attachment) imageResizeOptions.set("attachment", attachment);
        if (w) imageResizeOptions.set("w", w + "");
        if (h) imageResizeOptions.set("h", h + "");

        for (const q of queryParams) {
            if (q[0] === "attachment") continue;
            if (!q[0] || !q[1]) continue;
            if (q[1] === "undefined") continue;
            imageResizeOptions.set(q[0], q[1]);
        }
        const qStr =
            "?" +
            Array.from(imageResizeOptions.entries())
                .map(([k, v]) => `${k}=${v}`)
                .join("&");

        return base + qStr;
    }

    return baseHref + path;
}

export type ContentMetadataConfig<M = PageMetadata> = {
    titleTemplate?: (title: string, meta: M, fallback: Partial<M>) => string;
    imageLoading: (path: string) => string;
    canonicalBaseUrl?: string;
    fallback?: Partial<M>;
};

// @Injectable()
export class PageMetadataStrategy extends MetadataUpdateStrategy<ContentMetadataConfig> {
    readonly dom = inject(DOCUMENT);
    readonly injector = inject(Injector);

    constructor(config: ContentMetadataConfig<PageMetadata>) {
        super(config);
    }

    override async update(meta: PageMetadata, metaFallback: Partial<ContentMetadataConfig>) {
        const dom = this.dom;
        const fallback = metaFallback.fallback;

        meta = { ...fallback, ...meta } as PageMetadata;

        const title = runInInjectionContext(this.injector, () => this.config.titleTemplate?.(meta.title, meta, fallback) ?? meta.title);
        createTag(dom, new TitleMetaTag(title));
        createTag(dom, new LinkTag({ rel: "canonical", href: meta["url"] }));

        const image_path = meta.image ?? fallback?.image ?? "";
        const image = this.config?.imageLoading ? this.config.imageLoading(image_path) : image_path;
        meta.image = image;

        if (meta.externalLinks) {
            for (const link of meta.externalLinks) {
                createTag(dom, link);
            }
        }

        delete meta.title;
        delete meta["url"];
        delete meta.canonicalUrl;
        delete meta.externalLinks;
        renderMetaTags(dom, meta);
    }
}

export function renderMetaTags(dom: Document, meta: Record<string, any>, keyProperty: string | undefined = "name") {
    for (const key in meta) {
        const value = meta[key];
        if (typeof value === "string") {
            const content = value.trim();
            if (content) createTag(dom, new MetaTag(key, content, keyProperty));
        } else if (value instanceof Date) {
            createTag(dom, new MetaTag(key, value.toISOString(), keyProperty));
        } else if (typeof value === "number") createTag(dom, new MetaTag(key, value.toString(), keyProperty));
        else if (typeof value === "boolean") createTag(dom, new MetaTag(key, value ? "true" : "false", keyProperty));
    }
}
