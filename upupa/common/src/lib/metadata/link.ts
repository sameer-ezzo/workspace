// Base attributes potentially applicable to many link types (mostly optional here)
// Specific interfaces will often override or require 'href' and refine 'type' etc.
interface BaseLinkProps {
    crossorigin?: "anonymous" | "use-credentials";
    priority?: "high" | "low" | "auto";
    hreflang?: string;
    media?: string; // e.g., 'print', 'screen', '(max-width: 600px)'
    referrerpolicy?:
        | "no-referrer"
        | "no-referrer-when-downgrade"
        | "origin"
        | "origin-when-cross-origin"
        | "same-origin"
        | "strict-origin"
        | "strict-origin-when-cross-origin"
        | "unsafe-url";
    title?: string;
    integrity?: string; // For Subresource Integrity (SRI)
    // Common HTML attributes (optional, add more if needed for your framework like React/Vue)
    id?: string;
    className?: string; // Use className for React/JSX compatibility, 'class' is reserved
}

// --- Specific Link Types ---

interface LinkStylesheet extends BaseLinkProps {
    rel: "stylesheet";
    href: string; // URL of the CSS file
    disabled?: boolean; // Disables the stylesheet
    type?: "text/css"; // Often omitted as it's the default
    // media, title, integrity, fetchpriority, crossorigin are inherited optionally
}

interface LinkIcon extends BaseLinkProps {
    rel: "icon" | "shortcut icon"; // 'shortcut icon' is non-standard but common
    href: string; // URL of the icon file (.ico, .png, .svg, etc.)
    sizes?: string; // e.g., '16x16', '32x32', '16x16 32x32', 'any'
    type?: `image/${"png" | "jpeg" | "gif" | "svg+xml" | "x-icon" | "vnd.microsoft.icon"}`; // Common icon MIME types
    // media, title are inherited optionally
}

interface LinkAppleTouchIcon extends BaseLinkProps {
    rel: "apple-touch-icon";
    href: string; // URL of the icon file (usually PNG)
    sizes?: string; // e.g., '180x180', '152x152'
    // title is inherited optionally
}

interface LinkManifest extends BaseLinkProps {
    rel: "manifest";
    href: string; // URL of the manifest.json file
    // crossorigin is inherited optionally
}

interface LinkPreload extends BaseLinkProps {
    rel: "preload";
    href: string; // URL of the resource to preload
    as: // The type of content being loaded *is required*
    "audio" | "document" | "embed" | "fetch" | "font" | "image" | "object" | "script" | "style" | "track" | "video" | "worker";
    type?: string; // MIME type (important for 'font', 'style', 'script' etc.)
    // media, crossorigin, integrity, fetchpriority are inherited optionally
}

interface LinkModulePreload extends BaseLinkProps {
    rel: "modulepreload";
    href: string; // URL of the module script
    as?: "script"; // Technically optional, but useful for clarity
    // crossorigin, integrity are inherited optionally
}

interface LinkPrefetch extends BaseLinkProps {
    rel: "prefetch";
    href: string; // URL of the resource to prefetch
    as?: // Optional: type of content
    "audio" | "document" | "embed" | "fetch" | "font" | "image" | "object" | "script" | "style" | "track" | "video" | "worker";
    type?: string; // MIME type
    // crossorigin is inherited optionally
}

interface LinkPreconnect extends BaseLinkProps {
    rel: "preconnect";
    href: string; // The *origin* URL to connect to
    // crossorigin is inherited optionally (often needed)
}

interface LinkDnsPrefetch extends BaseLinkProps {
    rel: "dns-prefetch";
    href: string; // The *origin* URL to perform DNS lookup for
}

interface LinkPrerender extends BaseLinkProps {
    rel: "prerender";
    href: string; // URL of the page to prerender
}

interface LinkAlternate extends BaseLinkProps {
    rel: "alternate";
    href: string; // URL of the alternate representation
    type?: string; // MIME type (e.g., 'application/rss+xml', 'application/atom+xml', 'application/json', 'text/html')
    // hreflang, media, title are inherited optionally
}

interface LinkCanonical extends BaseLinkProps {
    rel: "canonical";
    href: string; // The preferred URL for the content
}

interface LinkAuthor extends BaseLinkProps {
    rel: "author";
    href: string; // URL or mailto: link for the author
    // title is inherited optionally
}

interface LinkHelp extends BaseLinkProps {
    rel: "help";
    href: string; // URL of a help document
    // title is inherited optionally
}

interface LinkLicense extends BaseLinkProps {
    rel: "license" | "copyright"; // 'copyright' is a common synonym
    href: string; // URL of the license document
    // title is inherited optionally
}

interface LinkNext extends BaseLinkProps {
    rel: "next";
    href: string; // URL of the next document in a series
    // title is inherited optionally
}

interface LinkPrev extends BaseLinkProps {
    rel: "prev" | "previous"; // 'previous' is a common synonym
    href: string; // URL of the previous document in a series
    // title is inherited optionally
}

interface LinkSearch extends BaseLinkProps {
    rel: "search";
    href: string; // URL of the search resource (e.g., OpenSearch description)
    type?: "application/opensearchdescription+xml";
    // title is inherited optionally
}

interface LinkPingback extends BaseLinkProps {
    rel: "pingback";
    href: string; // URL of the pingback server
}

// --- Discriminated Union Type ---
// This combines all the specific link types.
// TypeScript will infer the correct attributes based on the 'rel' provided.
export type LinkProps =
    | LinkStylesheet
    | LinkIcon
    | LinkAppleTouchIcon
    | LinkManifest
    | LinkPreload
    | LinkModulePreload
    | LinkPrefetch
    | LinkPreconnect
    | LinkDnsPrefetch
    | LinkPrerender
    | LinkAlternate
    | LinkCanonical
    | LinkAuthor
    | LinkHelp
    | LinkLicense
    | LinkNext
    | LinkPrev
    | LinkSearch
    | LinkPingback; // Add other less common ones (e.g., 'tag') if needed

// export abstract class BaseTag {
//     constructor(
//         public type: "title" | "link" | "meta",
//         public rel: string,
//         public name: string,
//         public content: string | undefined,
//         public attributes: Record<string, string> = {},
//     ) {}
// }

export class TitleMetaTag {
    constructor(
        public title: string | undefined,
        public attributes: Record<string, string> = {},
    ) {}
}
export class LinkTag {
    rel: string;
    href: string;
    priority?: "low" | "high";
    attributes: Record<string, string>;
    constructor(props: LinkProps) {
        this.rel = props.rel;
        this.href = props.href;
        delete props.rel;
        delete props.href;
        const attributes = { ...props } as Record<string, string>;
        this.attributes = attributes;
    }
}
export class MetaTag {
    constructor(
        public name: string,
        public content: string | undefined,
        public keyProperty: string | undefined = "name",
        public attributes: Record<string, string> = {},
    ) {}
}

export class StylesheetTag {
    type = "text/css";
    rel = "stylesheet";
    content: string;
    attributes?: Record<string, string>;

    constructor(props: Partial<Omit<LinkStylesheet, "rel" | "type">> & { content: string }) {
        this.content = props.content;
        delete props.content;
        this.attributes = { ...props } as unknown as Record<string, string>;
    }
}
export class ScriptTag {
    type = "text/javascript";
    rel = "script";
    content: string;
    attributes?: Record<string, string>;

    constructor(props: Partial<Omit<LinkStylesheet, "rel" | "type">> & { content: string }) {
        this.content = props.content;
        delete props.content;
        this.attributes = { ...props } as unknown as Record<string, string>;
    }
}

export function createTag(dom: Document, tag: LinkTag | StylesheetTag | TitleMetaTag | MetaTag | ScriptTag): void {
    let el: HTMLLinkElement | HTMLStyleElement | HTMLMetaElement | HTMLTitleElement | HTMLScriptElement;
    if (tag instanceof LinkTag) el = createLinkTag(dom, tag);
    else if (tag instanceof StylesheetTag) el = createStylesheetTag(dom, tag);
    else if (tag instanceof TitleMetaTag) el = createTitleTag(dom, tag);
    else if (tag instanceof MetaTag) el = createMetaTag(dom, tag);
    else if (tag instanceof ScriptTag) el = createScriptTag(dom, tag);
    else throw new Error("Unknown tag type");
    if (!el) {
        console.debug("Tag creation failed", tag);
        return;
    }
    dom.head.appendChild(dom.createTextNode("\n"));
    dom.head.appendChild(el);
}
function createStylesheetTag(dom: Document, tag: StylesheetTag): HTMLStyleElement {
    if (!tag.content) {
        console.debug("Stylesheet tag is missing content", tag);
        return undefined as unknown as HTMLStyleElement;
    }
    const el: HTMLStyleElement = dom.createElement("style");
    el.type = tag.type;
    el.textContent = tag.content;

    if (tag.attributes) {
        const id = tag.attributes["id"];
        if (id) dom.querySelector(`style#${id}`)?.remove();
        for (const [key, value] of Object.entries(tag.attributes)) {
            el.setAttribute(key, value);
        }
    }

    return el;
}

function createScriptTag(dom: Document, tag: ScriptTag): HTMLScriptElement {
    if (!tag.content) {
        console.debug("Script tag is missing content", tag);
        return undefined as unknown as HTMLScriptElement;
    }

    const el: HTMLScriptElement = dom.createElement("script");
    el.type = tag.type;
    el.textContent = tag.content;
    if (tag.attributes) {
        const id = tag.attributes["id"];
        if (id) dom.querySelector(`script#${id}`)?.remove();
        for (const [key, value] of Object.entries(tag.attributes)) {
            el.setAttribute(key, value);
        }
    }

    return el;
}

function createMetaTag(dom: Document, tag: MetaTag): HTMLMetaElement {
    if (!tag.name || !tag.content) {
        console.debug("Meta tag is missing name or content", tag);
        return undefined as unknown as HTMLMetaElement;
    }
    const el: HTMLMetaElement = dom.createElement("meta");
    const key = tag.keyProperty ?? "name";
    if (tag.name) {
        el.setAttribute(key, tag.name);
    }
    if (tag.content) {
        el.setAttribute("content", tag.content);
    }

    dom.querySelector(`meta[${key}="${tag.name}"]`)?.remove();

    if (tag.attributes) {
        for (const [key, value] of Object.entries(tag.attributes)) {
            el.setAttribute(key, value);
        }
    }

    return el;
}
function createTitleTag(dom: Document, tag: TitleMetaTag): HTMLTitleElement {
    dom.querySelector("title")?.remove();
    const title = (tag.title ?? "").trim();
    if (!title) {
        console.debug("Meta tag is missing title", tag);
        return undefined as unknown as HTMLTitleElement;
    }

    const el: HTMLTitleElement = dom.createElement("title");
    if (title.length) {
        el.textContent = title;
    }
    if (tag.attributes) {
        for (const [key, value] of Object.entries(tag.attributes)) {
            el.setAttribute(key, value);
        }
    }
    return el;
}
function createLinkTag(dom: Document, tag: LinkTag): HTMLLinkElement {
    if (!tag.rel || !tag.href) {
        console.debug("Link tag is missing rel or href", tag);
        return undefined as unknown as HTMLLinkElement;
    }
    const el = dom.createElement("link") as HTMLLinkElement;
    el.setAttribute("rel", tag.rel);
    el.setAttribute("href", tag.href);

    if (tag.priority) el.setAttribute("priority", tag.priority);

    dom.querySelector(`link[rel="${tag.rel}"][href="${tag.href}"]`)?.remove();
    for (const [key, value] of Object.entries(tag.attributes ?? {})) {
        el.setAttribute(key, value);
    }

    return el;
}
