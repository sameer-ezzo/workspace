export function cloneDeep<T>(obj: T): T {
    if (obj === null || typeof obj !== "object") {
        return obj;
    }

    return JSON.parse(JSON.stringify(obj));
}
