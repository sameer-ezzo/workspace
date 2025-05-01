import { inject, Injectable, InjectionToken, Injector, runInInjectionContext } from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { MetadataUpdateStrategy } from "../metadata.service";
import { PageMetadata } from "../models";
import { createTag, LinkTag, MetaTag, TitleMetaTag } from "../link";

export const CONTENT_METADATA_CONFIG = new InjectionToken<ContentMetadataConfig>("CONTENT_METADATA_CONFIG");
export const PAGE_METADATA_CONFIG = new InjectionToken<ContentMetadataConfig>("PAGE_METADATA_CONFIG");
const stripLeadingSlashes = (path: string) => path.replace(/^\/+/, "");
const stripTrailingSlashes = (path: string) => path.replace(/\/+$/, "");

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
    path: string,
    options: Partial<MetaImageLinkOptions> = {
        view: { w: "100", h: "100", attachment: "inline" },
    },
): string {
    const w = options?.view?.w;
    const h = options?.view?.h;
    const attachment = options?.view?.attachment;
    delete options.view;

    baseUrl = stripTrailingSlashes(baseUrl);
    path = stripLeadingSlashes((path || "").trim());
    let src = "";
    if (!path.length) src = baseUrl;
    else if (path.startsWith("http")) src = path;
    else src = baseUrl + "/" + path;

    const [base, qps] = src.split("?");
    const queryParams = (qps || "").split("&").map((q) => q.split("="));

    const imageResizeOptions = new Map<string, string>(Object.entries(options as Record<string, string>));
    if (attachment) imageResizeOptions.set("attachment", attachment);
    if (w || h || attachment) imageResizeOptions.set("view", "1");
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

export type ContentMetadataConfig<M = PageMetadata> = {
    titleTemplate?: (title: string) => string;
    imageLoading: (path: string) => string;
    canonicalBaseUrl?: string;
    fallback?: Partial<M>;
};

@Injectable()
export class PageMetadataStrategy implements MetadataUpdateStrategy<ContentMetadataConfig> {
    readonly config = inject(PAGE_METADATA_CONFIG);
    readonly dom = inject(DOCUMENT);
    readonly injector = inject(Injector);

    async update(meta: any, metaFallback: Partial<ContentMetadataConfig>) {
        const dom = this.dom;
        const fallback = metaFallback.fallback;

        meta = { ...fallback, ...meta }; //as PageMetadata;

        delete meta.twitter;
        delete meta.og;
        delete meta.schema;

        const title = runInInjectionContext(this.injector, () => meta.titleTemplate?.(meta.title) ?? this.config.titleTemplate?.(meta.title) ?? meta.title);
        createTag(dom, new TitleMetaTag(title));
        createTag(dom, new LinkTag({ rel: "canonical", href: meta["url"] }));

        const image_path = meta.image ?? fallback?.image ?? "";
        const image = this.config?.imageLoading ? this.config.imageLoading(image_path) : image_path;
        createTag(dom, new MetaTag("image", image));

        if (meta.externalLinks) {
            for (const link of meta.externalLinks) {
                createTag(dom, link);
            }
        }

        delete meta["image"];
        delete meta["title"];
        delete meta["canonical"];
        delete meta["externalLinks"];

        for (const key in meta) {
            const k = key; //as keyof PageMetadata;
            if (typeof meta[k] === "object" || typeof meta[k] === "function" || typeof meta[k] === "undefined") continue;
            const content = (meta[k] ?? "").trim();
            if (!content.length) continue;
            createTag(dom, new MetaTag(key, content));
        }
    }
}
