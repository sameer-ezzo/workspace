import { RouteFeature } from "../routing/route-feature";
import { ResolverRequest, contentResolver } from "../routing/route-resolver";
import { PageMetadata } from "./models";

/**
 * provide content the page as route.data = {content}.
 * Ideally used feature withComponentInputBinding to automatically pass content to the component input named `content`
 * Also, this content object is passed to the meta function to help generate metadata derived from content.
 * @param content static content to be provided.
 */
export function withContent<TContent>(content: TContent): RouteFeature {
    return {
        name: "withContent",
        modify: () => ({ data: { content } }),
    };
}

/**
 * provide content the page as route.resolve = {content}.
 * Ideally used feature withComponentInputBinding to automatically pass content to the component input named `content`
 * Also, this content object is passed to the meta function to help generate metadata derived from content.
 * @param contentFn dynamic content to be provided.
 */
export function withResolveContent(
    url: (resolveRequest: ResolverRequest) => string,
    map = (response) => response,
    options?: { headers?: { [header: string]: string } },
): RouteFeature {
    return {
        name: "withResolveContent",
        modify: () => ({ resolve: contentResolver(url, map, options) }),
    };
}

//TODO why meta function is dependent on content? it should be independent and if content is needed it should be injected
/**
 * provide metadata for the page for meta data service to update the page header
 * @param pageData static metadata for the page
 */
export function withPageMetadata(pageData: Partial<PageMetadata>): RouteFeature;
/**
 * provide metadata for the page for meta data service to update the page header
 * @param pageDataFn dynamic metadata for the page
 */
export function withPageMetadata<TContent = unknown>(pageDataFn: (content?: TContent) => Partial<PageMetadata>): RouteFeature;
export function withPageMetadata<TContent = unknown>(pageData: Partial<PageMetadata> | ((content?: TContent) => Partial<PageMetadata>)): RouteFeature {
    return {
        name: "withPageMetadata",
        modify: () => {
            if (typeof pageData === "function") return { data: { meta: pageData } };
            else return { data: { meta: () => pageData } };
        },
    };
}
