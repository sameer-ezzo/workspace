/**
 * Represents potential keys for grouping (strings, numbers, or symbols).
 */
type PropertyName = string | number | symbol;

/**
 * Represents a function that takes a value and returns a key for grouping.
 */
type ValueIteratee<T> = (value: T) => PropertyName;

/**
 * Represents the result of groupBy: an object where keys are group identifiers
 * and values are arrays of elements belonging to that group.
 * Using Record<string | number, ...> as object keys are coerced to strings or numbers.
 */
type GroupedResult<T> = Record<string | number, T[]>;

// --- Overloads matching the Lodash interface ---

/**
 * Creates an object composed of keys generated from the results of running each element of collection through
 * iteratee. The corresponding value of each key is an array of the elements responsible for generating the
 * key. The iteratee is invoked with one argument: (value).
 *
 * @param collection The array or array-like collection to iterate over.
 * @param iteratee The function invoked per iteration to generate the key. Defaults to identity function.
 * @return Returns the composed aggregate object.
 */
export function groupBy<T>(
    collection: readonly T[] | null | undefined, // Use readonly T[] for broader compatibility (arrays, tuples)
    iteratee?: ValueIteratee<T>,
): GroupedResult<T>;

/**
 * Creates an object composed of keys generated from the results of running each **value** of the object through
 * iteratee. The corresponding value of each key is an array of the **object values** responsible for generating the
 * key. The iteratee is invoked with one argument: (value).
 *
 * @param collection The object to iterate over (iterates over values).
 * @param iteratee The function invoked per iteration (on object values) to generate the key. Defaults to identity function.
 * @return Returns the composed aggregate object grouping the object's values.
 */
export function groupBy<T extends object>(
    collection: T | null | undefined,
    iteratee?: ValueIteratee<T[keyof T]>, // Iteratee operates on the *values* of the object
): GroupedResult<T[keyof T]>; // The result groups the *values*

// --- Implementation ---

/**
 * Actual implementation of the groupBy function.
 * This signature must be compatible with the overloads.
 */
export function groupBy<T>(
    collection: readonly any[] | object | null | undefined,
    iteratee?: ValueIteratee<any>, // Use 'any' in implementation signature for flexibility
): Record<string | number, any[]> {
    // Return type compatible with overload results
    const result: Record<string | number, any[]> = {};

    // Handle null or undefined input
    if (collection == null) {
        // Using == checks for both null and undefined
        return result;
    }

    // Provide a default iteratee (identity function) if none is supplied
    const resolvedIteratee = iteratee ?? ((value: any) => value);

    // Helper function to add an item to the appropriate group
    const addItemToGroup = (item: any) => {
        const groupKey = resolvedIteratee(item);

        // Ensure the key is suitable for an object property (string or number)
        // Symbols used as keys are less common in simple groupBy results, often converted to strings.
        const key: string | number = typeof groupKey === "symbol" ? groupKey.toString() : groupKey;

        // Check if the key already exists using hasOwnProperty for safety
        if (Object.prototype.hasOwnProperty.call(result, key)) {
            result[key].push(item);
        } else {
            // Create a new group if the key doesn't exist
            result[key] = [item];
        }
    };

    // --- Iterate based on collection type ---

    if (Array.isArray(collection)) {
        // Handle Arrays (and readonly arrays)
        for (const item of collection) {
            addItemToGroup(item);
        }
    } else if (typeof collection === "object") {
        // Handle Objects (iterate over values as specified in the second overload)
        // Use Object.values for iterating over object values directly
        for (const value of Object.values(collection)) {
            addItemToGroup(value);
        }
        // Alternative for older environments (iterating keys then getting values):
        // for (const key in collection) {
        //     if (Object.prototype.hasOwnProperty.call(collection, key)) {
        //         addItemToGroup((collection as Record<string | number | symbol, any>)[key]);
        //     }
        // }
    }
    // Note: This implementation doesn't explicitly handle non-plain objects or all ArrayLike types
    // (e.g., arguments, NodeList) as robustly as Lodash might, but covers common arrays and plain objects.

    return result;
}

// --- Example Usage ---

// // Example 1: Grouping an array of numbers by even/odd
// const numbers = [1, 2, 3, 4, 5, 6];
// const groupedByEvenOdd = groupBy(numbers, (n) => (n % 2 === 0 ? 'even' : 'odd'));
// console.log(groupedByEvenOdd);
// // Expected Output: { odd: [ 1, 3, 5 ], even: [ 2, 4, 6 ] }

// // Example 2: Grouping an array of objects by a property
// const people = [
//     { name: 'Alice', age: 30 },
//     { name: 'Bob', age: 20 },
//     { name: 'Charlie', age: 30 },
// ];
// const groupedByAge = groupBy(people, (person) => person.age);
// console.log(groupedByAge);
// // Expected Output: { '20': [ { name: 'Bob', age: 20 } ], '30': [ { name: 'Alice', age: 30 }, { name: 'Charlie', age: 30 } ] }

// // Example 3: Grouping an array of strings by their length
// const words = ['one', 'two', 'three', 'four', 'five'];
// const groupedByLength = groupBy(words, (word) => word.length);
// console.log(groupedByLength);
// // Expected Output: { '3': [ 'one', 'two' ], '5': [ 'three', 'five' ], '4': [ 'four' ] }

// // Example 4: Grouping without an iteratee (uses value itself)
// const values = [1, 'a', 1, 'b', 'a', 2];
// const groupedByValue = groupBy(values);
// console.log(groupedByValue);
// // Expected Output: { '1': [ 1, 1 ], a: [ 'a', 'a' ], b: [ 'b' ], '2': [ 2 ] }

// // Example 5: Grouping object *values* by some criteria
// const scores = { math: 90, science: 85, history: 90, art: 85 };
// const groupedScores = groupBy(scores, score => score >= 90 ? 'A' : 'B');
// console.log(groupedScores);
// // Expected Output: { A: [ 90, 90 ], B: [ 85, 85 ] }

// // Example 6: Handling null/undefined
// const groupedNull = groupBy(null);
// const groupedUndefined = groupBy(undefined);
// console.log(groupedNull);      // Expected Output: {}
// console.log(groupedUndefined); // Expected Output: {}
