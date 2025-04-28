/**
 * Creates a deep clone of a value.
 *
 * This function recursively clones objects and arrays. It handles primitives,
 * Date, RegExp, Map, Set, plain objects, and arrays. It also correctly
 * handles circular references. Functions are copied by reference, not cloned.
 * Uses WeakMap for efficient caching and garbage collection of visited objects.
 *
 * @template T The type of the value being cloned.
 * @param {T} value The value to clone.
 * @param {WeakMap<object, any>} [cache] Internal cache for handling circular references. Users should not provide this.
 * @returns {T} A deep clone of the value.
 */
export function cloneDeep<T>(value: T, cache = new WeakMap<object, any>()): T {
    // 1. Handle primitives, null, and functions (functions are not cloned, reference is copied)
    // typeof null is 'object', so explicit check is needed.
    if (value === null || typeof value !== "object") {
        return value;
    }

    // 2. Handle circular references
    // If the object is already in cache, return the cached clone
    if (cache.has(value)) {
        return cache.get(value);
    }

    // 3. Handle specific object types
    if (value instanceof Date) {
        // Create a new Date object with the same time value
        const copy = new Date(value.getTime());
        // Store the clone in cache before returning
        cache.set(value, copy);
        // We need to cast here because TypeScript doesn't know the specific type T is Date
        return copy as any;
    }

    if (value instanceof RegExp) {
        // Create a new RegExp object with the same source and flags
        const copy = new RegExp(value.source, value.flags);
        cache.set(value, copy);
        return copy as any;
    }

    if (value instanceof Map) {
        // Create a new Map
        const copy = new Map<any, any>();
        // Store the empty clone in cache *before* iterating to handle cycles
        cache.set(value, copy);
        // Iterate over entries and recursively clone both keys and values
        value.forEach((val, key) => {
            copy.set(cloneDeep(key, cache), cloneDeep(val, cache));
        });
        return copy as any;
    }

    if (value instanceof Set) {
        // Create a new Set
        const copy = new Set<any>();
        // Store the empty clone in cache *before* iterating
        cache.set(value, copy);
        // Iterate over values and recursively clone them
        value.forEach((val) => {
            copy.add(cloneDeep(val, cache));
        });
        return copy as any;
    }

    // 4. Handle Arrays
    if (Array.isArray(value)) {
        // Create a new array
        const copy: any[] = [];
        // Store the empty clone in cache *before* iterating
        cache.set(value, copy);
        // Iterate over elements and recursively clone them
        for (let i = 0; i < value.length; i++) {
            copy[i] = cloneDeep(value[i], cache);
        }
        return copy as any;
    }

    // 5. Handle plain Objects (and potentially others like Error objects)
    // Check if it's a plain object or has a specific prototype
    // Create a new object with the same prototype
    const copy = Object.create(Object.getPrototypeOf(value));

    // Store the empty clone in cache *before* copying properties
    cache.set(value, copy);

    // Copy all own properties (including symbols and non-enumerable, though we only deep clone values)
    // Reflect.ownKeys gets both string and symbol keys
    Reflect.ownKeys(value).forEach((key) => {
        const descriptor = Object.getOwnPropertyDescriptor(value, key);
        if (descriptor) {
            // Recursively clone the property value and assign it
            // This simple assignment works for data properties (value: ...)
            // It doesn't perfectly replicate getters/setters or writability flags,
            // but it matches common deep clone behavior.
            copy[key] = cloneDeep((value as any)[key], cache);

            // For a more precise clone preserving descriptors (more complex):
            // Object.defineProperty(copy, key, {
            //     ...descriptor,
            //     // Only clone 'value' if it's a data descriptor, not an accessor (get/set)
            //     ...(descriptor.hasOwnProperty('value') && { value: cloneDeep(descriptor.value, cache) })
            // });
        }
    });

    return copy;
}
