
// export class ArrayUtils {
//     static where<T = any>(data: T[], criteria: { [property: string]: string }): T[] {
//         if (!criteria) return data;
//         const properties = Object.keys(criteria);
//         if (properties.length === 0) return data;
//         return data.filter(x => properties.every(p => x[p] === criteria[p]));
//     }
//     static order<T>(data: T[], criteria: { [property: string]: "asc" | "desc" }) {
//         if (!criteria) return data;
//         const properties = Object.keys(criteria);
//         if (properties.length === 0) return data;

//         return data.sort((a, b) => {
//             for (let i = 0; i < properties.length; i++) {
//                 const p = properties[i];
//                 const direction = criteria[p] === "asc" ? 1 : -1;

//                 let cmp = 0;
//                 if (a[p] > b[p]) cmp = 1;
//                 if (a[p] < b[p]) cmp = -1;
//                 if (cmp != 0) return direction * cmp;
//             }
//         });
//     }


// }

function* filter<T>(data: IterableIterator<T>, predicate: (item: T) => boolean): IterableIterator<T> {
    if (!predicate) return data;
    while (true) {
        const item = data.next();
        if (predicate(item.value)) yield item.value;
        if (item.done) break;
    }
}
function* where<T>(data: IterableIterator<T>, criteria: { [property: string]: string }): IterableIterator<T> {
    if (!criteria) return data;
    const properties = Object.keys(criteria);
    if (properties.length === 0) return data;

    while (true) {
        const item = data.next();
        const x = item.value;
        if (properties.every(p => x[p] === criteria[p])) yield x;
        if (item.done) break;
    }
}

function* map<T, R>(data: IterableIterator<T>, callback: (item: T) => R): IterableIterator<R> {
    if (!callback) return data;
    while (true) {
        const item = data.next();
        yield callback(item.value);
        if (item.done) break;
    }
}

function* take<T>(data: IterableIterator<T>, n: number): IterableIterator<T> {
    let taken = 0;
    while (true) {
        const item = data.next();
        if (item.done) return item.value;

        ++taken;
        if (taken < n) yield item.value;
        else return item.value;

    }
}

function* range(from = 0, step = 1) {
    let i = from;
    while (true) {
        yield i;
        i += step;
    }
}


function* fromArray<T>(array: T[]) {
    for (let i = 0; i < array.length; i++) {
        const element = array[i];

        if (i === array.length - 1) return element;
        else yield element;
    }
}

function* skip<T>(data: IterableIterator<T>, n: number) {
    let skipped = 0;
    while (true) {
        const item = data.next();

        ++skipped;
        if (skipped > n) {
            if (item.done) return item.value;
            else yield item.value;
        }

        if (item.done) break;
    }
}

export class LazyArray<T = any> {
    constructor(private data: IterableIterator<T>) { }
    filter(predicate: (item: T) => boolean): LazyArray<T> {
        return new LazyArray<T>(filter(this.data, predicate));
    }
    map<R>(callback: (item: T) => R): LazyArray<R> {
        return new LazyArray<R>(map(this.data, callback));
    }
    sort(comparer: (a: T, b: T) => number): LazyArray<T> {
        const array = this.toArray();
        const sorted = array.sort(comparer);
        return new LazyArray<T>(fromArray(sorted));
    }
    skip(n: number): LazyArray<T> {
        return new LazyArray<T>(skip(this.data, n));
    }
    take(n: number): LazyArray<T> {
        return new LazyArray<T>(take(this.data, n));
    }
    where(criteria: { [property: string]: string }): LazyArray<T> {
        return new LazyArray<T>(where(this.data, criteria));
    }
    order(criteria: { [property: string]: string }): LazyArray<T> {
        if (!criteria) return new LazyArray(this.data);
        const properties = Object.keys(criteria);
        if (properties.length === 0) return new LazyArray(this.data);

        const array = this.toArray();

        const ordered = array.sort((a, b) => {
            for (let i = 0; i < properties.length; i++) {
                const p = properties[i];
                const direction = criteria[p] === "asc" ? 1 : -1;

                let cmp = 0;
                if (a[p] > b[p]) cmp = 1;
                if (a[p] < b[p]) cmp = -1;
                if (cmp != 0) return direction * cmp;
            }
        });

        return LazyArray.fromArray(ordered)
    }

    toArray(): T[] {
        const result = [];
        while (true) {
            const item = this.data.next();

            if (item.done) {
                if (item.value != undefined)
                    result.push(item.value);
                break;
            }
            else result.push(item.value);
        }
        return result;
    }

    static fromArray<T>(array): LazyArray<T> {
        return new LazyArray<T>(fromArray(array))
    }
    static range(from = 0, step = 1): LazyArray<number> {
        return new LazyArray<number>(range(from, step));
    }
}
