export type Class<T = any> = new (...args: any[]) => T;

export function slugify(title: string) {
    // Step 1: Convert to lowercase
    let slug = removeDiacritics(title).toLowerCase();

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

function removeDiacritics(text) {
    if (typeof text !== "string") {
        return ""; // Or throw an error, depending on your needs
    }

    return text
        .replace(/[\u0300-\u036f]/g, "") // most latin diacritics
        .replace(/[\u064b-\u065f]/g, ""); // arabic diacritics
}
