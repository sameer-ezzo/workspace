export type Class<T = any> = new (...args: any[]) => T;

export function slugify(title: string) {
    // Step 1: Convert to lowercase
    let slug = title.toLowerCase();

    // Step 2: Replace invalid URL characters (retain letters, numbers, spaces, and dashes)
    slug = slug.replace(/[^\p{L}\p{N}\s-]/gu, ""); // \p{L} for letters, \p{N} for numbers

    // Step 3: Replace multiple spaces or dashes with a single space
    slug = slug.replace(/[\s-]+/g, " ");

    // Step 4: Trim whitespace
    slug = slug.trim();

    // Step 5: Replace spaces with dashes
    slug = slug.replace(/\s+/g, "-");

    return slug;
}
