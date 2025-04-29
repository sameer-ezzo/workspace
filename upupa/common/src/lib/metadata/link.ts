// Base attributes potentially applicable to many link types (mostly optional here)
// Specific interfaces will often override or require 'href' and refine 'type' etc.
interface BaseLinkProps {
    crossorigin?: "anonymous" | "use-credentials";
    fetchpriority?: "high" | "low" | "auto";
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
