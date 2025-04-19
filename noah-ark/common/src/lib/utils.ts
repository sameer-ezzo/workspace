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

/**
 * Checks if a value is a plain object (created using {} or new Object()).
 * Excludes arrays, null, and other object types like Date, RegExp, etc.
 * @param item The value to check.
 * @returns True if the item is a plain object, false otherwise.
 */
function isPlainObject(item: unknown): item is Record<string, any> {
    if (item === null || typeof item !== "object") {
        return false;
    }
    // Check prototype: Get the direct prototype
    const proto = Object.getPrototypeOf(item);
    // Objects created with {} or new Object() have Object.prototype as prototype.
    // Objects created with Object.create(null) have no prototype.
    return proto === null || proto === Object.prototype;
}

/**
 * Deeply merges multiple source objects into a new object.
 * - Recursively merges properties of plain objects.
 * - Properties from later sources overwrite earlier ones if they are not plain objects or if the target property is not a plain object.
 * - Arrays are overwritten, not merged element by element.
 * - Does not mutate any of the source objects.
 *
 * @param objects The objects to merge. Sources later in the list take precedence.
 * @returns A new object representing the deep merge of all sources.
 */
export function deepMerge<T extends object = object>(...objects: Array<any>): T {
    const result: Record<string, any> = {}; // Start with an empty object

    for (const source of objects) {
        // Skip null, undefined, or non-object sources
        if (source === null || typeof source !== "object") {
            continue;
        }

        for (const key in source) {
            // Ensure the key is directly on the source object (not inherited)
            if (Object.prototype.hasOwnProperty.call(source, key)) {
                const sourceValue = source[key];
                const targetValue = result[key];

                // Recurse only if both source and target values are plain objects
                if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
                    result[key] = deepMerge(targetValue, sourceValue); // Recursive call
                }
                // Otherwise, overwrite:
                // - If targetValue is not a plain object
                // - If sourceValue is not a plain object (e.g., array, primitive, null, function)
                // - Handles initial assignment where targetValue is undefined
                else if (sourceValue !== undefined) {
                    // Assign the source value directly. Handles primitives, arrays, dates, etc.
                    result[key] = sourceValue;
                }
                // If sourceValue is undefined, we do nothing, preserving result[key]
            }
        }
    }

    return result as T;
}

export function uniqueId() {
    return Math.random().toString(36).substring(2, 9);
}
